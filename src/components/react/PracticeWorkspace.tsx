import { useCallback, useEffect, useState } from 'react';
import Combobox, { type Option } from './Combobox';
import { EmptyState, ErrorNote, SkeletonBlock, SkeletonLine } from './States';
import { postJson } from '../../lib/client/sse';
import { GRADES, SUBJECTS, subjectById, type SubjectId } from '../../lib/curriculum';
import type { PracticeSet } from '../../lib/types';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  HelpCircle,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react';

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
      {/* Setup Card */}
      <Card className="space-y-4 p-5 sm:p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 shadow-2xl backdrop-blur-md">
        <div>
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Practice & Active Recall Setup</span>
          </CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Flashcards to drill recall, then a quiz that explains every answer — including the misconception behind wrong choices.
          </CardDescription>
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
          <label htmlFor="topic" className="mb-1.5 block text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase">
            Topic to Practice
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder="e.g. Balancing chemical equations / Kinematic vectors"
              className="flex-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <Button
              type="button"
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 shrink-0 gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? 'Building...' : 'Build Practice Set'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {error && <ErrorNote message={error} onRetry={generate} />}

      {loading && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-6" aria-hidden="true">
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
        <div className="animate-fade space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-1">
            {(['flashcards', 'quiz'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all ${
                  tab === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
                className="group flex min-h-[14rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-8 text-center shadow-2xl transition-all duration-200 hover:border-emerald-500/50"
              >
                <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">
                  {flipped ? 'Answer Side' : 'Question Side'} · Card {cardIndex + 1} of {set.flashcards.length}
                </Badge>

                <p className={`text-sm sm:text-base leading-relaxed max-w-lg ${flipped ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'font-bold text-zinc-900 dark:text-zinc-100'}`}>
                  {flipped ? card.back : card.front}
                </p>

                <span className="text-[11px] font-mono text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {flipped ? 'Click to see question' : 'Click card to flip'}
                </span>
              </button>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCardIndex((i) => Math.max(0, i - 1));
                    setFlipped(false);
                  }}
                  disabled={cardIndex === 0}
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="flex gap-1.5">
                  {set.flashcards.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === cardIndex ? 'w-5 bg-emerald-500' : 'w-1.5 bg-zinc-300 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCardIndex((i) => Math.min(set.flashcards.length - 1, i + 1));
                    setFlipped(false);
                  }}
                  disabled={cardIndex === set.flashcards.length - 1}
                  className="border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 gap-1.5"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Quiz */}
          {tab === 'quiz' && (
            <div className="space-y-5">
              {set.quiz.map((q, qi) => {
                const choice = picked[qi];
                return (
                  <Card
                    key={qi}
                    className="space-y-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-lg"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                      {qi + 1}. {q.question}
                    </h4>

                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isPicked = choice === oi;
                        const isRight = oi === q.answerIndex;
                        let borderStyle = 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-300';

                        if (submitted && isRight) borderStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300';
                        else if (submitted && isPicked && !isRight) borderStyle = 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300';
                        else if (isPicked) borderStyle = 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/20 text-zinc-900 dark:text-zinc-100';

                        return (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-4 py-2.5 text-xs transition-all ${borderStyle}`}
                          >
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              checked={isPicked}
                              disabled={submitted}
                              onChange={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                              className="mt-0.5 accent-emerald-500"
                            />
                            <span className="flex-1">{opt}</span>
                            {submitted && isRight && (
                              <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                                Correct
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {submitted && (
                      <p className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Misconception Explanation:</span>
                        {q.explanation}
                      </p>
                    )}
                  </Card>
                );
              })}

              {!submitted ? (
                <Button
                  type="button"
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(picked).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 h-10 w-full sm:w-auto"
                >
                  Check My Answers
                </Button>
              ) : (
                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:flex-row sm:items-center sm:justify-between shadow-xl">
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                    You scored <span className="font-bold text-emerald-600 dark:text-emerald-400">{score} / {set.quiz.length}</span>.{' '}
                    {score === set.quiz.length
                      ? 'Perfect score! Topic mastered.'
                      : 'Review explanations for missed questions above.'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPicked({});
                      setSubmitted(false);
                    }}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-1.5 shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Try Again</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
