import { useCallback, useMemo, useRef, useState } from 'react';
import Combobox, { type Option } from './Combobox';
import Formula from './Formula';
import { EmptyState, ErrorNote, SkeletonBlock, SkeletonLine, TypingDots } from './States';
import { postJson, streamChat } from '../../lib/client/sse';
import { makeId, saveNote } from '../../lib/storage';
import {
  GRADES,
  SUBJECTS,
  booksFor,
  subjectById,
  type SubjectId,
} from '../../lib/curriculum';
import type { StudyNotes } from '../../lib/types';

interface ChatMsg {
  id: string;
  role: 'student' | 'tutor';
  text: string;
}

function NotesSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <SkeletonLine w="46%" />
        <SkeletonLine />
        <SkeletonLine w="82%" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2.5 rounded-xl border border-line bg-surface p-5">
          <SkeletonLine w="38%" />
          <SkeletonLine />
          <SkeletonLine w="90%" />
          <SkeletonLine w="66%" />
          {i === 0 && <SkeletonBlock h="2.5rem" />}
        </div>
      ))}
    </div>
  );
}

export default function NotesWorkspace() {
  const [grade, setGrade] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectId | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);

  const [notes, setNotes] = useState<StudyNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [replying, setReplying] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const books = booksFor(subject);
  const book = books.find((b) => b.id === bookId) ?? null;

  const subjectOptions: Option[] = SUBJECTS.map((s) => ({
    value: s.id,
    label: s.name,
    dot: `var(--color-${s.hue})`,
  }));
  const gradeOptions: Option[] = GRADES.map((g) => ({ value: g, label: g }));
  const bookOptions: Option[] = books.map((b) => ({
    value: b.id,
    label: b.name,
    hint: `${b.chapters.length} ch`,
  }));
  const chapterOptions: Option[] = (book?.chapters ?? []).map((c) => ({
    value: c,
    label: c,
  }));

  const ready = Boolean(grade && subject && book && chapter);

  const context = useMemo(
    () => ({
      grade,
      subject: subject ? subjectById(subject)?.name : null,
      book: book?.name ?? null,
      chapter,
    }),
    [grade, subject, book, chapter],
  );

  const generate = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    setNotes(null);
    setMessages([]);
    setSaved(false);
    try {
      const data = await postJson<{ notes: StudyNotes }>('/api/notes', context);
      setNotes(data.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate notes.');
    } finally {
      setLoading(false);
    }
  }, [ready, context]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || replying) return;

      const qId = makeId();
      const aId = makeId();
      setMessages((prev) => [
        ...prev,
        { id: qId, role: 'student', text: question },
        { id: aId, role: 'tutor', text: '' },
      ]);
      setDraft('');
      setReplying(true);
      setError(null);

      const history = messages.map((m) => ({
        role: m.role === 'student' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      requestAnimationFrame(() =>
        chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      );

      try {
        await streamChat(
          { ...context, context: 'notes', message: question, history },
          {
            onDelta: (chunk) =>
              setMessages((prev) =>
                prev.map((m) => (m.id === aId ? { ...m, text: m.text + chunk } : m)),
              ),
            onError: (message) => setError(message),
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lost the connection.');
      } finally {
        setReplying(false);
      }
    },
    [messages, replying, context],
  );

  const store = () => {
    if (!notes) return;
    const body = [
      notes.overview,
      '',
      ...notes.sections.flatMap((s) => [
        s.heading,
        ...s.keyPoints.map((p) => `• ${p}`),
        ...(s.definitions ?? []).map((d) => `${d.term}: ${d.meaning}`),
        ...(s.formulas ?? []),
        s.example ? `Example: ${s.example}` : '',
        '',
      ]),
      'Important questions:',
      ...notes.importantQuestions.map((q, i) => `${i + 1}. ${q}`),
      '',
      'Quick revision:',
      ...notes.quickRevision.map((q) => `• ${q}`),
    ]
      .filter((l) => l !== '')
      .join('\n');

    saveNote({
      title: notes.title,
      body,
      subject,
      grade,
      book: book?.name ?? null,
      chapter,
    });
    setSaved(true);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
      {/* Selection panel */}
      <aside className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-e1 lg:sticky lg:top-24">
        <div>
          <h2 className="text-h3 text-ink">Pick your chapter</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            Notes and the chat that follows stay anchored to this exact chapter.
          </p>
        </div>

        <div className="space-y-3.5">
          <Combobox label="Class / grade" options={gradeOptions} value={grade} onChange={setGrade} />
          <Combobox
            label="Subject"
            options={subjectOptions}
            value={subject}
            onChange={(v) => {
              setSubject(v as SubjectId | null);
              setBookId(null);
              setChapter(null);
            }}
          />
          <Combobox
            label="Textbook"
            options={bookOptions}
            value={bookId}
            onChange={(v) => {
              setBookId(v);
              setChapter(null);
            }}
            disabled={!subject}
            disabledHint="Choose a subject first"
          />
          <Combobox
            label="Chapter"
            options={chapterOptions}
            value={chapter}
            onChange={setChapter}
            disabled={!book}
            disabledHint="Choose a textbook first"
          />
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={!ready || loading}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? 'Writing notes…' : notes ? 'Regenerate notes' : 'Generate notes'}
        </button>

        {notes && (
          <button
            type="button"
            onClick={store}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            {saved ? 'Saved to your notes ✓' : 'Save to my notes'}
          </button>
        )}
      </aside>

      {/* Notes + chat */}
      <div className="min-w-0 space-y-8">
        {error && <ErrorNote message={error} onRetry={notes ? undefined : generate} />}

        {loading && <NotesSkeleton />}

        {!loading && !notes && !error && (
          <EmptyState
            glyph="📓"
            title="No chapter selected yet"
            body="Choose your class, subject, textbook and chapter, then generate revision notes you can question afterwards."
          />
        )}

        {notes && !loading && (
          <article className="animate-rise space-y-7">
            <header className="space-y-2">
              <p className="text-overline text-ink-3 uppercase">
                {[grade, subjectById(subject!)?.name, book?.name].filter(Boolean).join(' · ')}
              </p>
              <h2 className="text-h2 text-ink">{notes.title}</h2>
              <p className="text-[15px] leading-relaxed text-ink-2">{notes.overview}</p>

              {/* Action Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => send(`Explain the core topic of "${notes.title}" in detail.`)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-brand/40 hover:text-brand transition-all"
                >
                  Explain this topic
                </button>
                <button
                  type="button"
                  onClick={() => send(`Explain "${notes.title}" with a simpler real-world analogy.`)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-brand/40 hover:text-brand transition-all"
                >
                  Simplify
                </button>
                <button
                  type="button"
                  onClick={() => send(`Give a step-by-step example problem for "${notes.title}".`)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-brand/40 hover:text-brand transition-all"
                >
                  Give an example
                </button>
                <a
                  href={`/practice?topic=${encodeURIComponent(notes.title)}&subject=${subject || ''}&grade=${grade || ''}`}
                  className="rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-all"
                >
                  Quiz me
                </a>
                <a
                  href={`/flashcards?topic=${encodeURIComponent(notes.title)}&subject=${subject || ''}&grade=${grade || ''}`}
                  className="rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-all"
                >
                  Make flashcards
                </a>
              </div>
            </header>

            {notes.sections.map((section, i) => (
              <section
                key={i}
                className="space-y-3.5 rounded-xl border border-line bg-surface p-5 shadow-e1"
              >
                <h3 className="text-h3 text-ink">{section.heading}</h3>

                <ul className="space-y-2">
                  {section.keyPoints.map((point, j) => (
                    <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {section.definitions && section.definitions.length > 0 && (
                  <dl className="space-y-2 rounded-lg bg-sunken px-3.5 py-3">
                    {section.definitions.map((d) => (
                      <div key={d.term}>
                        <dt className="text-sm font-semibold text-ink">{d.term}</dt>
                        <dd className="text-sm leading-relaxed text-ink-2">{d.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {section.formulas && section.formulas.length > 0 && (
                  <div className="space-y-2">
                    {section.formulas.map((f, j) => (
                      <div
                        key={j}
                        className="scroll-slim overflow-x-auto rounded-lg border border-line bg-canvas px-3.5 py-2.5"
                      >
                        <Formula tex={f} />
                      </div>
                    ))}
                  </div>
                )}

                {section.example && (
                  <p className="rounded-md border-l-2 border-accent bg-accent-soft px-3.5 py-2.5 text-sm leading-relaxed text-ink-2">
                    <span className="font-semibold text-ink">Example — </span>
                    {section.example}
                  </p>
                )}
              </section>
            ))}

            <div className="grid gap-5 sm:grid-cols-2">
              <section className="space-y-2.5 rounded-xl border border-line bg-surface p-5">
                <h3 className="text-overline text-ink-3 uppercase">Likely test questions</h3>
                <ol className="space-y-2">
                  {notes.importantQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                      <span className="font-semibold text-brand">{i + 1}.</span>
                      <button
                        type="button"
                        onClick={() => send(q)}
                        className="text-left transition-colors hover:text-brand hover:underline"
                        title="Ask the tutor this"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="space-y-2.5 rounded-xl border border-line bg-surface p-5">
                <h3 className="text-overline text-ink-3 uppercase">Quick revision</h3>
                <ul className="space-y-2">
                  {notes.quickRevision.map((q, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                      <span className="mt-0.5 text-accent" aria-hidden="true">
                        ✓
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>
        )}

        {/* Chapter-scoped chat */}
        {notes && (
          <section className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-e1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-h3 text-ink">Ask about this chapter</h3>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                {chapter}
              </span>
            </div>

            {messages.length === 0 && (
              <p className="text-sm leading-relaxed text-ink-2">
                Every answer stays anchored to this chapter — tap a test question
                above, or ask your own below.
              </p>
            )}

            {messages.length > 0 && (
              <div className="scroll-slim max-h-[26rem] space-y-3.5 overflow-y-auto pr-1">
                {messages.map((m) =>
                  m.role === 'student' ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-xl rounded-br-sm bg-ink px-3.5 py-2.5 text-sm leading-relaxed text-canvas">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <div key={m.id} className="max-w-[92%]">
                      {m.text ? (
                        <p className="rounded-xl rounded-bl-sm bg-sunken px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                          {m.text}
                        </p>
                      ) : (
                        <div className="rounded-xl bg-sunken px-3.5 py-2.5">
                          <TypingDots label="Thinking" />
                        </div>
                      )}
                    </div>
                  ),
                )}
                <div ref={chatEnd} />
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="flex gap-2"
            >
              <label htmlFor="notes-chat" className="sr-only">
                Ask about {chapter}
              </label>
              <input
                id="notes-chat"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Ask anything about ${chapter}…`}
                className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-ink-3 focus:border-brand focus:ring-4 focus:ring-brand-ring"
              />
              <button
                type="submit"
                disabled={replying || !draft.trim()}
                className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:translate-y-px disabled:opacity-45"
              >
                Ask
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
