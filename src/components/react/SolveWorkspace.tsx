import { useCallback, useEffect, useRef, useState } from 'react';
import AnswerCard from './AnswerCard';
import Composer from './Composer';
import EntryGallery from './EntryGallery';
import FormulaReferenceModal from './FormulaReferenceModal';
import { AnswerSkeleton, ErrorNote, TypingDots } from './States';
import { postJson, streamChat } from '../../lib/client/sse';
import { addHistory, makeId, saveNote } from '../../lib/storage';
import { subjectById, type SubjectId } from '../../lib/curriculum';
import type { Depth, ModeId, TutorAnswer } from '../../lib/types';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Sparkles,
  BookOpen,
  Send,
  MessageSquare,
  HelpCircle,
  Folder,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  FileText
} from 'lucide-react';

interface Turn {
  id: string;
  kind: 'question' | 'answer' | 'reply';
  text?: string;
  answer?: TutorAnswer;
  mode?: ModeId;
  attachments?: { name: string; kind: 'image' | 'pdf' }[];
}

interface LastRequest {
  question: string;
  mode: ModeId;
  subject: SubjectId | null;
  grade: string | null;
  attachments: { kind: 'image' | 'pdf'; mediaType: string; data: string; name: string }[];
}

export default function SolveWorkspace() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [subject, setSubject] = useState<SubjectId | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState('');
  const [pickNonce, setPickNonce] = useState(0);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'solution' | 'chat'>('solution');
  const [chatInputText, setChatInputText] = useState('');

  const last = useRef<LastRequest | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToChatBottom = useCallback(() => {
    requestAnimationFrame(() =>
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
    );
  }, []);

  const firstQuestion = turns.find((t) => t.kind === 'question');
  const firstAnswer = turns.find((t) => t.kind === 'answer');
  const followUpTurns = firstAnswer ? turns.slice(turns.indexOf(firstAnswer) + 1) : [];

  useEffect(() => {
    if (followUpTurns.length) scrollToChatBottom();
  }, [followUpTurns.length, replying, scrollToChatBottom]);

  // Read URL search params (e.g. ?question=...&subject=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('question');
    const s = params.get('subject');
    const g = params.get('grade');
    if (q) setPrefill(q);
    if (s && subjectById(s)) setSubject(s as SubjectId);
    if (g) setGrade(g);
  }, []);

  const runSolve = useCallback(
    async (req: LastRequest, depth: Depth = 'normal', showQuestion = true) => {
      last.current = req;
      setError(null);
      setSavedId(null);
      setSolving(true);

      if (showQuestion) {
        setTurns((prev) => [
          ...prev,
          {
            id: makeId(),
            kind: 'question',
            text: req.question || '(see attached file)',
            attachments: req.attachments.map((a) => ({ name: a.name, kind: a.kind })),
          },
        ]);
      }

      try {
        const data = await postJson<{ answer: TutorAnswer }>('/api/solve', {
          question: req.question,
          mode: req.mode,
          subject: req.subject ? subjectById(req.subject)?.name : null,
          grade: req.grade,
          attachments: req.attachments,
          depth,
        });

        setTurns((prev) => [
          ...prev,
          { id: makeId(), kind: 'answer', answer: data.answer, mode: req.mode },
        ]);

        addHistory({
          question: req.question || `(file: ${req.attachments[0]?.name ?? 'attachment'})`,
          subject: req.subject,
          mode: req.mode,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setSolving(false);
      }
    },
    [],
  );

  const askFollowUp = useCallback(
    async (question: string) => {
      if (!question.trim() || replying) return;
      setError(null);
      setReplying(true);
      setMobileTab('chat');

      const qId = makeId();
      const aId = makeId();
      setTurns((prev) => [
        ...prev,
        { id: qId, kind: 'question', text: question },
        { id: aId, kind: 'reply', text: '' },
      ]);
      setChatInputText('');

      type HistoryMsg = { role: 'user' | 'assistant'; content: string };
      const history = turns.flatMap<HistoryMsg>((t) => {
        if (t.kind === 'question') {
          return [{ role: 'user', content: t.text ?? '' }];
        }
        if (t.kind === 'reply') {
          return [{ role: 'assistant', content: t.text ?? '' }];
        }
        if (t.answer) {
          const a = t.answer;
          const summary = [
            a.understanding,
            ...a.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`),
            a.finalAnswer ? `Answer: ${a.finalAnswer}` : '',
          ]
            .filter(Boolean)
            .join('\n');
          return [{ role: 'assistant', content: summary }];
        }
        return [];
      });

      try {
        await streamChat(
          {
            message: question,
            history,
            subject: subject ? subjectById(subject)?.name : null,
            grade,
          },
          (chunk) => {
            setTurns((prev) =>
              prev.map((t) => (t.id === aId ? { ...t, text: (t.text ?? '') + chunk } : t)),
            );
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Follow-up failed.');
      } finally {
        setReplying(false);
      }
    },
    [replying, turns, subject, grade],
  );

  const handleSaveNote = useCallback(() => {
    if (!firstAnswer?.answer) return;
    const a = firstAnswer.answer;
    const textLines = [
      `Understanding: ${a.understanding}`,
      '',
      ...a.steps.map((s, i) => `${i + 1}. ${s.title}\n${s.detail}`),
      '',
      a.finalAnswer ? `Final Answer: ${a.finalAnswer}` : '',
    ].join('\n');

    const id = saveNote({
      title: firstQuestion?.text?.slice(0, 60) || 'Saved Solution',
      body: textLines,
      subject,
      grade,
    });
    setSavedId(id);
  }, [firstAnswer, firstQuestion, subject, grade]);

  const reset = () => {
    setTurns([]);
    setError(null);
    setSavedId(null);
    setPrefill('');
  };

  const busy = solving || replying;
  const isSolved = turns.some((t) => t.kind === 'answer');

  return (
    <div className="space-y-6">
      {/* Context Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1 font-mono text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{subject ? subjectById(subject)?.name : 'All Subjects'}</span>
          </Badge>
          {grade && (
            <Badge variant="outline" className="border-zinc-800 text-zinc-300 text-xs font-mono">
              {grade}
            </Badge>
          )}
          {isSolved && (
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              · Solution Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormulaModalOpen(true)}
            className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>Formula Sheet</span>
          </Button>

          {isSolved && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span>New Question</span>
            </Button>
          )}
        </div>
      </div>

      {/* Primary Composer Input (When not yet solved) */}
      {!isSolved && (
        <div className="space-y-6">
          <Composer
            onSubmit={(payload) => runSolve(payload, 'normal', true)}
            busy={busy}
            subject={subject}
            setSubject={setSubject}
            grade={grade}
            setGrade={setGrade}
            initialText={prefill}
            initialTextNonce={pickNonce}
            showInputHints
            showExamples
          />

          <EntryGallery
            onPick={({ question, subject: s, grade: g }) => {
              setPrefill(question);
              if (s) setSubject(s);
              if (g) setGrade(g);
              setPickNonce((n) => n + 1);
            }}
          />
        </div>
      )}

      {/* Error state */}
      {error && <ErrorNote message={error} onRetry={() => last.current && runSolve(last.current)} />}

      {/* Loading state skeleton */}
      {solving && !isSolved && (
        <div className="space-y-4 animate-fade">
          <AnswerSkeleton />
        </div>
      )}

      {/* Dual-Pane Solved Workspace */}
      {isSolved && (
        <div className="space-y-4 animate-fade">
          {/* Mobile Tab Switcher */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('solution')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                mobileTab === 'solution'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Solution Stage
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'chat'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>AI Tutor Chat</span>
              {followUpTurns.length > 0 && (
                <span className="rounded-full bg-emerald-400 px-1.5 py-0.2 text-[10px] text-zinc-950 font-bold">
                  {followUpTurns.filter((t) => t.kind === 'question').length}
                </span>
              )}
            </button>
          </div>

          {/* Grid Layout: Left Solution Stage (60%), Right Chat Panel (40%) */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
            {/* LEFT COLUMN: Problem Card & Solution Stage */}
            <div className={`space-y-6 ${mobileTab === 'chat' ? 'hidden lg:block' : 'block'}`}>
              {/* Question Header Card */}
              {firstQuestion && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-wider font-bold">
                    <span>Problem Statement</span>
                    <Badge variant="outline" className="border-zinc-800 text-emerald-400">
                      {firstQuestion.mode ?? 'Walkthrough'}
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap">
                    {firstQuestion.text}
                  </p>
                  {firstQuestion.attachments && firstQuestion.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {firstQuestion.attachments.map((a) => (
                        <span
                          key={a.name}
                          className="rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300"
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Main Answer Card */}
              {firstAnswer?.answer && (
                <AnswerCard
                  answer={firstAnswer.answer}
                  mode={firstAnswer.mode ?? 'guide'}
                  actions={{
                    busy,
                    savedLabel: savedId ? 'Saved ✓' : null,
                    onSimplify: () =>
                      last.current && runSolve(last.current, 'simpler', false),
                    onDetailed: () =>
                      last.current && runSolve(last.current, 'detailed', false),
                    onRegenerate: () =>
                      last.current && runSolve(last.current, 'normal', false),
                    onSaveNote: handleSaveNote,
                    onPractise: () => {
                      const topic = firstAnswer.answer?.understanding ?? '';
                      const params = new URLSearchParams({ topic });
                      if (subject) params.set('subject', subject);
                      if (grade) params.set('grade', grade);
                      window.location.href = `/practice?${params.toString()}`;
                    },
                    onAsk: askFollowUp,
                  }}
                />
              )}
            </div>

            {/* RIGHT COLUMN: Dedicated AI Tutor Chat Panel */}
            <div className={`sticky top-20 ${mobileTab === 'solution' ? 'hidden lg:block' : 'block'}`}>
              <Card className="flex flex-col h-[75vh] border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden rounded-2xl">
                {/* Chat Panel Header */}
                <CardHeader className="border-b border-zinc-800 bg-zinc-900/90 px-4 py-3.5 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100">AI Tutor Assistant</h3>
                      <p className="text-[10px] font-mono text-zinc-400">Ask follow-up questions in real-time</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 text-[10px]">
                    Online
                  </Badge>
                </CardHeader>

                {/* Scrollable Chat Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-slim bg-zinc-950">
                  {followUpTurns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-200">
                        Have a question about the steps or derivation?
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs">
                        Ask follow-ups here — your answer stays fixed on the left!
                      </p>
                    </div>
                  ) : (
                    followUpTurns.map((turn) => {
                      if (turn.kind === 'question') {
                        return (
                          <div key={turn.id} className="animate-fade flex justify-end">
                            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm leading-relaxed">
                              <p className="whitespace-pre-wrap">{turn.text}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={turn.id}
                          className="animate-fade rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
                            <Sparkles className="h-3 w-3" />
                            <span>Stepwise Tutor</span>
                          </div>
                          {turn.text ? (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-200 font-medium">
                              {turn.text}
                            </p>
                          ) : (
                            <TypingDots label="Tutor is typing..." />
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Dedicated Inline Chat Input Box (Pinned to Bottom) */}
                <div className="border-t border-zinc-800 bg-zinc-900/90 p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (chatInputText.trim()) askFollowUp(chatInputText);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <Input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Ask a follow-up about this problem..."
                      className="flex-1 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500"
                    />
                    <Button
                      type="submit"
                      disabled={!chatInputText.trim() || busy}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 h-9 shrink-0 gap-1.5"
                    >
                      <span>{replying ? '...' : 'Send'}</span>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Formula Reference Cheat Sheet Modal */}
      <FormulaReferenceModal
        isOpen={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        onSelectFormula={(latex) => {
          setPrefill((prev) => (prev ? `${prev} ${latex}` : latex));
          setPickNonce((n) => n + 1);
        }}
      />
    </div>
  );
}
