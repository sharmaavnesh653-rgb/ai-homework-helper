import { useState } from 'react';
import Formula from './Formula';
import VisualBlock from './VisualBlock';
import type { ModeId, TutorAnswer } from '../../lib/types';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  CheckCircle2,
  HelpCircle,
  Sparkles,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Copy,
  Download,
  Bookmark,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sliders,
  Check,
  AlertTriangle,
  Send
} from 'lucide-react';

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
    <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xl backdrop-blur-md space-y-0">
      {/* What the question is asking */}
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 px-5 py-4 sm:px-6 flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider">
            Target Understanding
          </Badge>
          <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {answer.understanding}
          </p>
        </div>

        {totalSteps > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStepByStep(!stepByStep);
              if (!stepByStep) setRevealedCount(1);
            }}
            className="h-8 gap-1.5 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0"
          >
            <ListOrdered className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{stepByStep ? 'View All Steps' : 'Step-by-Step Reveal'}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-7">
        {/* DIRECT FINAL ANSWER (When present) */}
        {answer.finalAnswer && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white font-bold shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Final Direct Answer</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {answer.finalAnswer}
              </p>
            </div>
          </div>
        )}

        {/* HOW TO SOLVE: Reasoning steps */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {mode === 'hint' ? 'Guided Hint' : 'How To Solve'}
            </h4>
            {stepByStep && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Step {revealedCount} of {totalSteps}
              </span>
            )}
          </div>

          <ol className="space-y-4">
            {displayedSteps.map((step, i) => (
              <li key={i} className="relative flex gap-3.5">
                {i < displayedSteps.length - 1 && (
                  <span
                    className="absolute top-8 left-[13px] w-px bg-zinc-200 dark:bg-zinc-800"
                    style={{ bottom: '-1rem' }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm font-mono">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setOpenHintIndex(openHintIndex === i ? null : i)}
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Lightbulb className="h-3 w-3" />
                      <span>{openHintIndex === i ? 'Hide hint' : 'Step hint'}</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{step.detail}</p>

                  {openHintIndex === i && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">Hint for Step {i + 1}:</span>
                      <p>Focus on identifying given variables before applying the equation.</p>
                    </div>
                  )}

                  {step.formula && (
                    <div className="scroll-slim overflow-x-auto rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3">
                      <Formula tex={step.formula} />
                    </div>
                  )}

                  {step.note && (
                    <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>{step.note}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {stepByStep && revealedCount < totalSteps && (
            <div className="pt-2 flex justify-center">
              <Button
                onClick={() => setRevealedCount((prev) => Math.min(prev + 1, totalSteps))}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
              >
                <span>Reveal Next Step ({revealedCount + 1} of {totalSteps})</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* WHY: Key Formula Summary */}
        {answer.formulaSummary && (
          <section className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Formula To Remember</h4>
            <div className="scroll-slim overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
              <Formula tex={answer.formulaSummary} />
            </div>
          </section>
        )}

        {/* VISUAL EXPLANATION */}
        {answer.visual && (
          <section className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Visual Diagram</h4>
            <VisualBlock visual={answer.visual} />
          </section>
        )}

        {/* KEY CONCEPTS */}
        {answer.concepts.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Key Concepts</h4>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {answer.concepts.map((c) => (
                <div key={c.term} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 space-y-1">
                  <dt className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{c.term}</dt>
                  <dd className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">{c.meaning}</dd>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EXAMPLE */}
        {answer.workedExample && (
          <section className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Related Example</h4>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{answer.workedExample.prompt}</p>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{answer.workedExample.walkthrough}</p>
            </div>
          </section>
        )}

        {/* INTERACTIVE CHECK YOURSELF */}
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Check Yourself Question</h4>
            <Badge className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">Active Practice</Badge>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">{answer.checkYourself}</p>

          <form onSubmit={handleCheckSubmit} className="space-y-2 pt-1">
            <div className="flex gap-2">
              <Input
                type="text"
                value={studentCheckInput}
                onChange={(e) => setStudentCheckInput(e.target.value)}
                placeholder="Type your answer to verify your understanding..."
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              <Button
                type="submit"
                disabled={!studentCheckInput.trim() || actions.busy}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 shrink-0"
              >
                <span>Submit</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            {checkSubmitted && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <Check className="h-3.5 w-3.5" />
                <span>Submitted! Checking your response with AI tutor below...</span>
              </p>
            )}
          </form>
        </section>

        {/* NEXT ACTIONS TOOLBAR */}
        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={actions.onSimplify}
              disabled={actions.busy}
              className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Explain Simpler
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={actions.onDetailed}
              disabled={actions.busy}
              className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              More Detail
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={actions.onRegenerate}
              disabled={actions.busy}
              className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Regenerate</span>
            </Button>

            <Button
              size="sm"
              onClick={actions.onPractise}
              disabled={actions.busy}
              className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Make Flashcards & Quiz</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={actions.onSaveNote}
              disabled={actions.busy}
              className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{actions.savedLabel ?? 'Save to Notes'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-1.5"
            >
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
              <span>{copied ? 'Copied ✓' : 'Copy Text'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={download}
              className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Export Solution</span>
            </Button>
          </div>
        </div>

        {/* SUGGESTED FOLLOW-UPS */}
        {answer.followUps.length > 0 && (
          <section className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ask Next</h4>
            <div className="flex flex-wrap gap-2">
              {answer.followUps.slice(0, 3).map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={actions.busy}
                  onClick={() => actions.onAsk(f)}
                  className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-3.5 py-1.5 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {f}
                </button>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
