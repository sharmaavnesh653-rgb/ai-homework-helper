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
  const [draft, setDraft] = useState('');
  const [pickNonce, setPickNonce] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
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
            mode: last.current?.mode ?? 'guide',
            subject: subject ? subjectById(subject)?.name : null,
            grade,
          },
          {
            onDelta: (chunk) =>
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === aId ? { ...t, text: (t.text ?? '') + chunk } : t,
                ),
              ),
            onError: (message) => setError(message),
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lost the connection.');
      } finally {
        setReplying(false);
        setChatInputText('');
      }
    },
    [turns, replying, subject, grade],
  );

  const latestAnswer = [...turns].reverse().find((t) => t.kind === 'answer');

  const [prefill, setPrefill] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setPrefill(q.slice(0, 6000));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSaveNote = () => {
    if (!latestAnswer?.answer) return;
    const a = latestAnswer.answer;
    const body = [
      a.understanding,
      '',
      ...a.steps.map((s, i) => `${i + 1}. ${s.title}\n${s.detail}${s.formula ? `\n${s.formula}` : ''}`),
      '',
      ...(a.concepts.length ? ['Key concepts:', ...a.concepts.map((c) => `- ${c.term}: ${c.meaning}`)] : []),
      a.finalAnswer ? `\nAnswer: ${a.finalAnswer}` : '',
      `\nCheck yourself: ${a.checkYourself}`,
    ].join('\n');

    const note = saveNote({
      title: a.understanding.slice(0, 90),
      body,
      subject,
      grade,
      book: null,
      chapter: null,
    });
    setSavedId(note.id);
  };

  const busy = solving || replying;
  const isSolved = Boolean(firstAnswer?.answer);

  return (
    <div className={`space-y-6 transition-all ${focusMode ? 'max-w-5xl mx-auto' : ''}`}>
      {/* Top Digital Desk Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ok animate-pulse" />
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            NoteGPT Workspace
          </span>
          {subject && (
            <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
              {subjectById(subject)?.name}
            </span>
          )}
          {grade && (
            <span className="rounded-md bg-sunken px-2 py-0.5 text-xs font-medium text-ink-2">
              {grade}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormulaModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-2 transition-all hover:border-brand/40 hover:text-brand"
          >
            <span>∑ Formula Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              focusMode
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line bg-canvas text-ink-2 hover:border-line-strong hover:text-ink'
            }`}
          >
            <span>{focusMode ? '🎯 Focus Active' : '🎯 Focus Mode'}</span>
          </button>
        </div>
      </div>

      {/* Initial Hero Input State (when no turns exist yet) */}
      {!isSolved && !solving && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Composer
            busy={busy}
            subject={subject}
            setSubject={setSubject}
            grade={grade}
            setGrade={setGrade}
            initialText={prefill}
            initialTextNonce={pickNonce}
            onDraftChange={setDraft}
            showExamples={false}
            showInputHints={true}
            onSubmit={(payload) => runSolve(payload)}
          />

          {error && (
            <ErrorNote
              message={error}
              onRetry={
                last.current ? () => runSolve(last.current!, 'normal', false) : undefined
              }
            />
          )}

          <EntryGallery
            hasDraft={draft.trim().length > 0}
            onPick={(question) => {
              setPrefill(question);
              setPickNonce((n) => n + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Solving Skeleton Loading */}
      {solving && (
        <div className="max-w-3xl mx-auto space-y-4 py-8">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-brand">
            <span className="animate-spin text-lg">⚙</span> Generating structured solution & MindMap diagram...
          </div>
          <AnswerSkeleton />
        </div>
      )}

      {/* NoteGPT Dual-Pane Split Workspace (when solved) */}
      {isSolved && (
        <div className="space-y-4">
          {/* Mobile Tab Switcher */}
          <div className="flex rounded-xl border border-line bg-surface p-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('solution')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                mobileTab === 'solution'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              📑 Solution & MindMap
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'chat'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              <span>💬 AI Tutor Chat</span>
              {followUpTurns.length > 0 && (
                <span className="rounded-full bg-ok px-1.5 py-0.2 text-[10px] text-white font-bold">
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
                <div className="rounded-xl border border-line bg-ink px-5 py-4 text-canvas shadow-e1">
                  <div className="flex items-center justify-between text-xs text-canvas/70 mb-2 font-semibold uppercase tracking-wider">
                    <span>Problem Statement</span>
                    <span>{firstQuestion.mode ?? 'Walkthrough'}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                    {firstQuestion.text}
                  </p>
                  {firstQuestion.attachments && firstQuestion.attachments.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 pt-2">
                      {firstQuestion.attachments.map((a) => (
                        <li
                          key={a.name}
                          className="rounded bg-canvas/15 px-2 py-0.5 text-xs text-canvas/85"
                        >
                          {a.kind === 'pdf' ? '📄' : '🖼'} {a.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Main Answer Card with Step Reveal, MindMap, KaTeX, Check Yourself */}
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
              <div className="flex flex-col h-[75vh] rounded-2xl border border-line bg-surface shadow-e2 overflow-hidden">
                {/* Chat Panel Header */}
                <div className="flex items-center justify-between border-b border-line bg-sunken/60 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand font-semibold text-xs">
                      💬
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">AI Tutor Assistant</h3>
                      <p className="text-[11px] text-ink-3">Ask follow-up questions in real-time</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-[11px] font-semibold text-ok">
                    Online
                  </span>
                </div>

                {/* Scrollable Chat Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-slim bg-canvas/40">
                  {followUpTurns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                      <span className="text-3xl">🤖</span>
                      <p className="text-xs font-medium text-ink-2">
                        Have a question about the steps or mindmap?
                      </p>
                      <p className="text-[11px] text-ink-3">
                        Ask follow-ups here — your answer stays fixed on the left!
                      </p>
                    </div>
                  ) : (
                    followUpTurns.map((turn) => {
                      if (turn.kind === 'question') {
                        return (
                          <div key={turn.id} className="animate-rise flex justify-end">
                            <div className="max-w-[85%] rounded-xl rounded-br-sm bg-brand px-3.5 py-2.5 text-xs leading-relaxed text-white shadow-sm">
                              <p className="whitespace-pre-wrap">{turn.text}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={turn.id}
                          className="animate-rise rounded-xl border border-line bg-surface p-3.5 shadow-sm space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand">
                            <span>🤖 Stepwise Tutor</span>
                          </div>
                          {turn.text ? (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap text-ink">
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
                <div className="border-t border-line bg-surface p-3 space-y-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (chatInputText.trim()) askFollowUp(chatInputText);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Ask a follow-up about this problem..."
                      className="flex-1 rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring placeholder:text-ink-3"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || busy}
                      className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-hover active:translate-y-px disabled:opacity-40 transition-all shrink-0"
                    >
                      {replying ? '...' : 'Send'}
                    </button>
                  </form>
                </div>
              </div>
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
