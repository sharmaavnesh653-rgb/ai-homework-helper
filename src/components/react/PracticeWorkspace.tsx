import { useCallback, useEffect, useState } from 'react';
import Combobox, { type Option } from './Combobox';
import { EmptyState, ErrorNote, SkeletonBlock, SkeletonLine } from './States';
import { postJson } from '../../lib/client/sse';
import { GRADES, SUBJECTS, subjectById, type SubjectId } from '../../lib/curriculum';
import type { PracticeSet } from '../../lib/types';

type Tab = 'flashcards' | 'quiz';

export default function PracticeWorkspace() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState<SubjectId | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [set, setSet] = useState<PracticeSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('flashcards');

  // Flashcards
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Prefill from the "Practise this" action on an answer card.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('topic');
    const s = params.get('subject');
    const g = params.get('grade');
    if (t) setTopic(t.slice(0, 200));
    if (s && SUBJECTS.some((x) => x.id === s)) setSubject(s as SubjectId);
    if (g && (GRADES as readonly string[]).includes(g)) setGrade(g);
  }, []);

  const generate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setSet(null);
    setPicked({});
    setSubmitted(false);
    setCardIndex(0);
    setFlipped(false);
    try {
      const data = await postJson<{ practice: PracticeSet }>('/api/practice', {
        topic: topic.trim(),
        subject: subject ? subjectById(subject)?.name : null,
        grade,
      });
      setSet(data.practice);
      setTab(data.practice.flashcards.length ? 'flashcards' : 'quiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build a practice set.');
    } finally {
      setLoading(false);
    }
  }, [topic, subject, grade]);

  const card = set?.flashcards[cardIndex];
  const score = set
    ? set.quiz.reduce((n, q, i) => (picked[i] === q.answerIndex ? n + 1 : n), 0)
    : 0;

  return (
    <div className="space-y-8">
      {/* Setup */}
      <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-e1 sm:p-6">
        <div>
          <h2 className="text-h3 text-ink">What do you want to practise?</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            Flashcards to drill recall, then a quiz that explains every answer —
            including why the tempting wrong one is wrong.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Combobox
            label="Subject"
            options={SUBJECTS.map<Option>((s) => ({
              value: s.id,
              label: s.name,
              dot: `var(--color-${s.hue})`,
            }))}
            value={subject}
            onChange={(v) => setSubject(v as SubjectId | null)}
            placeholder="Any subject"
            clearable
          />
          <Combobox
            label="Class / level"
            options={GRADES.map<Option>((g) => ({ value: g, label: g }))}
            value={grade}
            onChange={setGrade}
            placeholder="Any level"
            clearable
          />
        </div>

        <div>
          <label htmlFor="topic" className="mb-1.5 block text-overline text-ink-3 uppercase">
            Topic
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder="e.g. Balancing chemical equations"
              className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-ink-3 focus:border-brand focus:ring-4 focus:ring-brand-ring"
            />
            <button
              type="button"
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="shrink-0 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:translate-y-px disabled:opacity-45"
            >
              {loading ? 'Building…' : 'Build practice set'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorNote message={error} onRetry={generate} />}

      {loading && (
        <div className="space-y-4 rounded-xl border border-line bg-surface p-6" aria-hidden="true">
          <SkeletonLine w="30%" />
          <SkeletonBlock h="9rem" />
          <div className="flex gap-2">
            <SkeletonLine w="24%" />
            <SkeletonLine w="24%" />
          </div>
        </div>
      )}

      {!loading && !set && !error && (
        <EmptyState
          glyph="🎴"
          title="Nothing to practise yet"
          body="Name a topic above — or come here straight from an answer using “Practise this”."
        />
      )}

      {set && !loading && (
        <div className="animate-rise space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-sunken p-1" role="tablist">
            {(['flashcards', 'quiz'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-all duration-150 ${
                  tab === t ? 'bg-surface text-ink shadow-e1' : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {t} ({t === 'flashcards' ? set.flashcards.length : set.quiz.length})
              </button>
            ))}
          </div>

          {/* Flashcards */}
          {tab === 'flashcards' && card && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setFlipped((v) => !v)}
                className="group flex min-h-[13rem] w-full flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-e2 transition-all duration-200 hover:shadow-e3"
                aria-live="polite"
              >
                <span className="text-overline text-ink-3 uppercase">
                  {flipped ? 'Answer' : 'Question'} · card {cardIndex + 1} of{' '}
                  {set.flashcards.length}
                </span>
                <span
                  className={`text-[17px] leading-relaxed ${
                    flipped ? 'text-ink-2' : 'font-semibold text-ink'
                  }`}
                >
                  {flipped ? card.back : card.front}
                </span>
                <span className="text-xs text-ink-3 opacity-0 transition-opacity group-hover:opacity-100">
                  {flipped ? 'Tap to see the question' : 'Tap to reveal'}
                </span>
              </button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCardIndex((i) => Math.max(0, i - 1));
                    setFlipped(false);
                  }}
                  disabled={cardIndex === 0}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
                >
                  ← Previous
                </button>

                <div className="flex gap-1.5" aria-hidden="true">
                  {set.flashcards.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === cardIndex ? 'w-5 bg-brand' : 'w-1.5 bg-line-strong'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCardIndex((i) => Math.min(set.flashcards.length - 1, i + 1));
                    setFlipped(false);
                  }}
                  disabled={cardIndex === set.flashcards.length - 1}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Quiz */}
          {tab === 'quiz' && (
            <div className="space-y-5">
              {set.quiz.map((q, qi) => {
                const choice = picked[qi];
                return (
                  <fieldset
                    key={qi}
                    className="space-y-3 rounded-xl border border-line bg-surface p-5"
                  >
                    <legend className="text-[15px] leading-relaxed font-semibold text-ink">
                      {qi + 1}. {q.question}
                    </legend>

                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isPicked = choice === oi;
                        const isRight = oi === q.answerIndex;
                        let tone = 'border-line hover:border-line-strong';
                        if (submitted && isRight) tone = 'border-ok bg-ok-soft';
                        else if (submitted && isPicked && !isRight)
                          tone = 'border-danger bg-danger-soft';
                        else if (isPicked) tone = 'border-brand bg-brand-soft';

                        return (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-all ${tone}`}
                          >
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              checked={isPicked}
                              disabled={submitted}
                              onChange={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                              className="mt-0.5 accent-brand"
                            />
                            <span className="text-ink-2">{opt}</span>
                            {submitted && isRight && (
                              <span className="ml-auto shrink-0 text-xs font-semibold text-ok">
                                correct
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {submitted && (
                      <p className="animate-fade rounded-lg bg-sunken px-3.5 py-2.5 text-sm leading-relaxed text-ink-2">
                        {q.explanation}
                      </p>
                    )}
                  </fieldset>
                );
              })}

              {!submitted ? (
                <button
                  type="button"
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(picked).length === 0}
                  className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-hover active:translate-y-px disabled:opacity-45 sm:w-auto"
                >
                  Check my answers
                </button>
              ) : (
                <div className="animate-rise flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] text-ink">
                    You scored{' '}
                    <span className="font-semibold text-brand">
                      {score} / {set.quiz.length}
                    </span>
                    .{' '}
                    {score === set.quiz.length
                      ? 'Every one right — try a harder topic.'
                      : 'Read the explanations for the ones you missed.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked({});
                      setSubmitted(false);
                    }}
                    className="shrink-0 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
