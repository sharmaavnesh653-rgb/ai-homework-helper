import { useState } from 'react';
import Formula from './Formula';
import VisualBlock from './VisualBlock';
import type { ModeId, TutorAnswer } from '../../lib/types';

export interface AnswerActions {
  onSimplify: () => void;
  onDetailed: () => void;
  onRegenerate: () => void;
  onSaveNote: () => void;
  onPractise: () => void;
  onAsk: (question: string) => void;
  busy?: boolean;
  savedLabel?: string | null;
}

function Chip({
  children,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'brand';
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';
  const tones = {
    default:
      'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink hover:shadow-e1',
    brand: 'border-brand/25 bg-brand-soft text-brand hover:border-brand/50 hover:shadow-e1',
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${tones[tone]}`}>
      {children}
    </button>
  );
}

function Section({
  overline,
  children,
}: {
  overline: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4 className="text-overline text-ink-3 uppercase">{overline}</h4>
      {children}
    </section>
  );
}

export default function AnswerCard({
  answer,
  mode,
  actions,
}: {
  answer: TutorAnswer;
  mode: ModeId;
  actions: AnswerActions;
}) {
  const [copied, setCopied] = useState(false);
  const [stepByStep, setStepByStep] = useState(false);
  const [revealedCount, setRevealedCount] = useState(1);
  const [studentCheckInput, setStudentCheckInput] = useState('');
  const [checkSubmitted, setCheckSubmitted] = useState(false);
  const [openHintIndex, setOpenHintIndex] = useState<number | null>(null);

  const totalSteps = answer.steps.length;
  const displayedSteps = stepByStep ? answer.steps.slice(0, revealedCount) : answer.steps;

  const asText = () => {
    const lines: string[] = [answer.understanding, ''];
    answer.steps.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.title}`);
      lines.push(`   ${s.detail}`);
      if (s.formula) lines.push(`   ${s.formula}`);
      if (s.note) lines.push(`   Note: ${s.note}`);
      lines.push('');
    });
    if (answer.concepts.length) {
      lines.push('Key concepts:');
      answer.concepts.forEach((c) => lines.push(`- ${c.term}: ${c.meaning}`));
      lines.push('');
    }
    if (answer.finalAnswer) lines.push(`Answer: ${answer.finalAnswer}`, '');
    lines.push(`Check yourself: ${answer.checkYourself}`);
    return lines.join('\n');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([asText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stepwise-walkthrough.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCheckInput.trim()) return;
    setCheckSubmitted(true);
    actions.onAsk(`My attempt at the check-yourself question ("${answer.checkYourself}") is: ${studentCheckInput}`);
  };

  return (
    <article className="animate-rise overflow-hidden rounded-xl border border-line bg-surface shadow-e2">
      {/* What the question is asking */}
      <header className="border-b border-line bg-sunken/60 px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-overline mb-1 text-ink-3 uppercase">What you're being asked</h3>
          <p className="text-[15px] leading-relaxed font-medium text-ink">
            {answer.understanding}
          </p>
        </div>

        {totalSteps > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStepByStep(!stepByStep);
                if (!stepByStep) setRevealedCount(1);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-2 transition-all hover:border-brand/40 hover:text-brand"
            >
              <span>{stepByStep ? '👁 View all steps' : '🐾 Step-by-step reveal'}</span>
            </button>
          </div>
        )}
      </header>

      <div className="space-y-7 px-5 py-6 sm:px-6">
        {/* Reasoning steps — the core */}
        <Section overline={mode === 'hint' ? 'Your nudge' : 'Working through it'}>
          {/* Step reveal progress bar when step-by-step mode is on */}
          {stepByStep && (
            <div className="mb-4 space-y-1.5 rounded-lg border border-line bg-canvas p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span>Step Progress</span>
                <span className="text-brand">
                  Step {revealedCount} of {totalSteps}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full bg-brand transition-all duration-300 rounded-full"
                  style={{ width: `${(revealedCount / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          <ol className="space-y-5">
            {displayedSteps.map((step, i) => (
              <li key={i} className="animate-rise relative flex gap-3.5">
                {/* Connector rail between step markers */}
                {i < displayedSteps.length - 1 && (
                  <span
                    className="absolute top-8 left-[13px] w-px bg-line"
                    style={{ bottom: '-1.25rem' }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white shadow-sm">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-[15px] leading-snug font-semibold text-ink">
                      {step.title}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setOpenHintIndex(openHintIndex === i ? null : i)}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      {openHintIndex === i ? 'Hide hint' : '💡 Step hint'}
                    </button>
                  </div>

                  <p className="text-[15px] leading-relaxed text-ink-2">{step.detail}</p>

                  {openHintIndex === i && (
                    <div className="animate-fade rounded-lg border border-brand/20 bg-brand-soft/60 px-3.5 py-2.5 text-xs text-ink-2">
                      <span className="font-semibold text-brand">Hint for Step {i + 1}:</span> Focus on identifying the key variables first before applying the formula.
                    </div>
                  )}

                  {step.formula && (
                    <div className="scroll-slim overflow-x-auto rounded-lg bg-sunken px-3.5 py-3">
                      <Formula tex={step.formula} />
                    </div>
                  )}
                  {step.note && (
                    <p className="flex gap-2 rounded-md border-l-2 border-accent bg-accent-soft px-3 py-2 text-sm leading-relaxed text-ink-2">
                      <span aria-hidden="true">⚠</span>
                      <span>{step.note}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Show Next Step Button */}
          {stepByStep && revealedCount < totalSteps && (
            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setRevealedCount((prev) => Math.min(prev + 1, totalSteps))}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-e2 transition-all hover:bg-brand-hover hover:shadow-e3 active:translate-y-px"
              >
                <span>Show Next Step ({revealedCount + 1} of {totalSteps})</span>
                <span aria-hidden="true">↓</span>
              </button>
            </div>
          )}
        </Section>

        {answer.formulaSummary && (
          <Section overline="Formula to remember">
            <div className="scroll-slim overflow-x-auto rounded-lg border border-line bg-sunken px-3.5 py-3.5">
              <Formula tex={answer.formulaSummary} />
            </div>
          </Section>
        )}

        {answer.visual && (
          <Section overline="Visual explanation">
            <VisualBlock visual={answer.visual} />
          </Section>
        )}

        {answer.concepts.length > 0 && (
          <Section overline="Key concepts">
            <dl className="grid gap-2.5 sm:grid-cols-2">
              {answer.concepts.map((c) => (
                <div key={c.term} className="rounded-lg border border-line bg-canvas px-3.5 py-3">
                  <dt className="text-sm font-semibold text-ink">{c.term}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-2">{c.meaning}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {answer.workedExample && (
          <Section overline="Another example">
            <div className="space-y-2 rounded-lg border border-line bg-canvas px-4 py-3.5">
              <p className="text-sm font-semibold text-ink">{answer.workedExample.prompt}</p>
              <p className="text-sm leading-relaxed text-ink-2">
                {answer.workedExample.walkthrough}
              </p>
            </div>
          </Section>
        )}

        {answer.finalAnswer ? (
          <div className="flex items-start gap-3 rounded-lg border border-ok/30 bg-ok-soft px-4 py-3.5">
            <span
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok text-[11px] font-bold text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <div>
              <h4 className="text-overline text-ok uppercase">Final answer</h4>
              <p className="mt-1 text-[15px] leading-relaxed font-semibold text-ink">
                {answer.finalAnswer}
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 text-sm leading-relaxed text-ink-3">
            {mode === 'hint'
              ? 'No answer here — that part is yours. Ask again if you need the next hint.'
              : "No corrected version on purpose — the improved answer should come from you."}
          </p>
        )}

        {/* Interactive Check Yourself section */}
        <div className="space-y-3 rounded-xl border-l-4 border-brand bg-brand-soft/70 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-overline text-brand uppercase font-bold tracking-wider">Check yourself</h4>
            <span className="text-xs font-semibold text-brand/80">Interactive Practice</span>
          </div>
          <p className="text-[15px] leading-relaxed text-ink font-medium">{answer.checkYourself}</p>

          <form onSubmit={handleCheckSubmit} className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={studentCheckInput}
                onChange={(e) => setStudentCheckInput(e.target.value)}
                placeholder="Type your answer to verify understanding..."
                className="flex-1 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring placeholder:text-ink-3"
              />
              <button
                type="submit"
                disabled={!studentCheckInput.trim() || actions.busy}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover active:translate-y-px disabled:opacity-50 transition-all shrink-0"
              >
                Submit Answer
              </button>
            </div>
            {checkSubmitted && (
              <p className="animate-fade text-xs font-medium text-ok flex items-center gap-1.5 pt-1">
                <span>✓ Attempt submitted! Checking your response with tutor below...</span>
              </p>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="space-y-3 border-t border-line pt-5">
          <div className="flex flex-wrap gap-2">
            <Chip onClick={actions.onSimplify} disabled={actions.busy}>
              Explain simpler
            </Chip>
            <Chip onClick={actions.onDetailed} disabled={actions.busy}>
              More detail
            </Chip>
            <Chip onClick={actions.onRegenerate} disabled={actions.busy}>
              Regenerate
            </Chip>
            <Chip onClick={actions.onPractise} disabled={actions.busy} tone="brand">
              Practise this
            </Chip>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip onClick={actions.onSaveNote} disabled={actions.busy}>
              {actions.savedLabel ?? 'Save to notes'}
            </Chip>
            <Chip onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</Chip>
            <Chip onClick={download}>Download</Chip>
          </div>
        </div>

        {/* Suggested follow-ups, in the student's voice */}
        {answer.followUps.length > 0 && (
          <Section overline="Ask next">
            <div className="flex flex-wrap gap-2">
              {answer.followUps.slice(0, 3).map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={actions.busy}
                  onClick={() => actions.onAsk(f)}
                  className="rounded-full border border-line bg-canvas px-3.5 py-1.5 text-left text-sm text-ink-2 transition-all hover:border-brand/40 hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                >
                  {f}
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </article>
  );
}
