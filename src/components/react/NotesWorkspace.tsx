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
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Layers,
  Bookmark,
  Send,
  Check,
  FileText,
  Sliders,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

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
        <div key={i} className="space-y-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
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
      {/* Selection Panel */}
      <Card className="space-y-4 p-5 border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-md lg:sticky lg:top-20">
        <div>
          <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Select Chapter</span>
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Flow: Class → Subject → Textbook → Chapter
          </CardDescription>
        </div>

        <div className="space-y-3.5">
          <Combobox label="Class / Grade" options={gradeOptions} value={grade} onChange={setGrade} />
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

        <Button
          type="button"
          onClick={generate}
          disabled={!ready || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-10 gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>{loading ? 'Writing notes...' : notes ? 'Regenerate Notes' : 'Generate Notes'}</span>
        </Button>

        {notes && (
          <Button
            type="button"
            variant="outline"
            onClick={store}
            className="w-full border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-2"
          >
            <Bookmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{saved ? 'Saved to Notes ✓' : 'Save to Library'}</span>
          </Button>
        )}
      </Card>

      {/* Main Notes Document + AI Chat */}
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
          <article className="animate-fade space-y-7">
            {/* Header Breadcrumb */}
            <header className="space-y-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-6 shadow-xl">
              <div className="flex flex-wrap items-center gap-2">
                {[grade, subjectById(subject!)?.name, book?.name].filter(Boolean).map((item) => (
                  <Badge key={item} variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                    {item}
                  </Badge>
                ))}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{notes.title}</h2>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">{notes.overview}</p>

              {/* Contextual Action Pills */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => send(`Explain the core topic of "${notes.title}" in detail.`)}
                  className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Explain Topic
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => send(`Explain "${notes.title}" with a simpler real-world analogy.`)}
                  className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Simplify
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => send(`Give a step-by-step example problem for "${notes.title}".`)}
                  className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Give Example
                </Button>

                <a
                  href={`/practice?topic=${encodeURIComponent(notes.title)}&subject=${subject || ''}&grade=${grade || ''}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-all"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Quiz Me</span>
                </a>

                <a
                  href={`/flashcards?topic=${encodeURIComponent(notes.title)}&subject=${subject || ''}&grade=${grade || ''}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-all"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Make Flashcards</span>
                </a>
              </div>
            </header>

            {/* Note Sections */}
            {notes.sections.map((section, i) => (
              <Card key={i} className="border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 p-5 space-y-4 shadow-lg">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{section.heading}</h3>

                <ul className="space-y-2">
                  {section.keyPoints.map((point, j) => (
                    <li key={j} className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {section.definitions && section.definitions.length > 0 && (
                  <dl className="space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800">
                    {section.definitions.map((d) => (
                      <div key={d.term}>
                        <dt className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{d.term}</dt>
                        <dd className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">{d.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {section.formulas && section.formulas.length > 0 && (
                  <div className="space-y-2">
                    {section.formulas.map((f, j) => (
                      <div
                        key={j}
                        className="scroll-slim overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3"
                      >
                        <Formula tex={f} />
                      </div>
                    ))}
                  </div>
                )}

                {section.example && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Example Walkthrough:</span>
                    {section.example}
                  </div>
                )}
              </Card>
            ))}

            {/* Questions & Quick Revision Grid */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 p-5 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Likely Exam Questions</h3>
                <ol className="space-y-2">
                  {notes.importantQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{i + 1}.</span>
                      <button
                        type="button"
                        onClick={() => send(q)}
                        className="text-left transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline"
                        title="Ask the tutor this question"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 p-5 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Quick Revision Key Points</h3>
                <ul className="space-y-2">
                  {notes.quickRevision.map((q, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </article>
        )}

        {/* Chapter-Scoped AI Chat */}
        {notes && (
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 shadow-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Ask AI Tutor About This Chapter</h3>
              </div>
              <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-mono text-[10px]">
                {chapter}
              </Badge>
            </div>

            {messages.length === 0 && (
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Every answer stays anchored to this chapter — tap an exam question above or ask your own below.
              </p>
            )}

            {messages.length > 0 && (
              <div className="scroll-slim max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {messages.map((m) =>
                  m.role === 'student' ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <div key={m.id} className="max-w-[92%]">
                      {m.text ? (
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                          {m.text}
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3">
                          <TypingDots label="Tutor thinking..." />
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
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Ask anything about ${chapter}...`}
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              <Button
                type="submit"
                disabled={replying || !draft.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 h-9 gap-1.5 shrink-0"
              >
                <span>Ask</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
