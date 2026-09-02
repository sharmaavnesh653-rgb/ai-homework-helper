import Formula from './Formula';
import { subjectById, type SubjectId } from '../../lib/curriculum';

/**
 * The landing state of the solver: subject cards that each demonstrate a real
 * output type, a strip of the other study tools, and a preview of the answer
 * anatomy so a student knows what they're about to get.
 *
 * Every card is a real control — clicking one loads that question into the
 * composer.
 */

type Preview =
  | { kind: 'formula'; tex: string }
  | { kind: 'arc' }
  | { kind: 'equation'; tex: string }
  | { kind: 'parts'; parts: string[] }
  | { kind: 'chips'; chips: string[] }
  | { kind: 'thesis'; before: string; marked: string; after: string }
  | { kind: 'trace'; steps: string[] };

interface Showcase {
  subject: SubjectId;
  /** Shown on the card. */
  teaser: string;
  /** Loaded into the composer. */
  question: string;
  preview: Preview;
}

const SHOWCASE: Showcase[] = [
  {
    subject: 'math',
    teaser: 'Solve a quadratic and say which method fits',
    question:
      'Solve x² − 5x + 6 = 0 and explain which method you chose and why that one.',
    preview: { kind: 'formula', tex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  },
  {
    subject: 'physics',
    teaser: 'Find the maximum height of a projectile',
    question:
      'A ball is thrown at 20 m/s at 30° above the horizontal. Find its maximum height and total range. Take g = 9.8 m/s².',
    preview: { kind: 'arc' },
  },
  {
    subject: 'chemistry',
    teaser: 'Balance an equation, tracking every atom',
    question:
      'Balance the equation for the complete combustion of propane, and show how you tracked each element.',
    preview: { kind: 'equation', tex: '\\mathrm{C_3H_8 + 5O_2 \\rightarrow 3CO_2 + 4H_2O}' },
  },
  {
    subject: 'biology',
    teaser: 'Name the parts and what each one does',
    question:
      'Explain what happens to a plant cell placed in a concentrated sugar solution, and name the process at each stage.',
    preview: { kind: 'parts', parts: ['Cell wall', 'Membrane', 'Vacuole'] },
  },
  {
    subject: 'history',
    teaser: 'Weigh a cause against its consequences',
    question:
      'How far was the Treaty of Versailles responsible for political instability in Germany in the 1920s?',
    preview: { kind: 'chips', chips: ['Cause', 'Evidence', 'Counter-argument'] },
  },
  {
    subject: 'english',
    teaser: 'Get your thesis pulled apart, not rewritten',
    question:
      'Check my thesis statement: "In Macbeth, Shakespeare shows that ambition is bad and it ruins people."',
    preview: {
      kind: 'thesis',
      before: 'Shakespeare presents ambition as ',
      marked: 'self-destructive',
      after: ' because…',
    },
  },
  {
    subject: 'cs',
    teaser: 'Trace an algorithm step by step',
    question:
      'Trace a binary search for the value 23 in the list [4, 8, 15, 16, 23, 42] and state each comparison made.',
    preview: { kind: 'trace', steps: ['lo=0 hi=5', 'mid=2 → 15<23', 'mid=4 → found'] },
  },
  {
    subject: 'geography',
    teaser: 'Explain how a landform forms over time',
    question: 'Explain how a waterfall forms and then retreats to create a gorge.',
    preview: { kind: 'chips', chips: ['Erosion', 'Undercutting', 'Retreat'] },
  },
];

/* ---------------------------- previews ---------------------------- */

function PreviewBody({ preview, hue }: { preview: Preview; hue: string }) {
  const stroke = `var(--color-${hue})`;

  switch (preview.kind) {
    case 'formula':
    case 'equation':
      return (
        <div className="scroll-slim overflow-x-auto text-[13px] text-ink">
          <Formula tex={preview.tex} display={false} />
        </div>
      );

    case 'arc':
      // A projectile arc with its apex marked — the shape of the answer, drawn.
      return (
        <svg viewBox="0 0 150 46" className="h-11 w-full" aria-hidden="true">
          <path
            d="M6 42 Q 75 -8 144 42"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
          <line x1="75" y1="17" x2="75" y2="42" stroke={stroke} strokeWidth="1" opacity="0.5" />
          <circle cx="75" cy="17" r="3.5" fill={stroke} />
          <circle cx="6" cy="42" r="2.5" fill={stroke} opacity="0.6" />
        </svg>
      );

    case 'parts':
      return (
        <ul className="space-y-1">
          {preview.parts.map((p, i) => (
            <li key={p} className="flex items-center gap-2 text-[12.5px] text-ink-2">
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white"
                style={{ background: stroke }}
              >
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ul>
      );

    case 'chips':
      return (
        <div className="flex flex-wrap gap-1.5">
          {preview.chips.map((c) => (
            <span
              key={c}
              className="rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
              style={{ borderColor: stroke, color: stroke }}
            >
              {c}
            </span>
          ))}
        </div>
      );

    case 'thesis':
      return (
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          {preview.before}
          <span className="marker font-medium text-ink">{preview.marked}</span>
          {preview.after}
        </p>
      );

    case 'trace':
      return (
        <ol className="space-y-0.5 font-mono text-[11.5px] text-ink-2">
          {preview.steps.map((s) => (
            <li key={s} className="flex gap-1.5">
              <span style={{ color: stroke }} aria-hidden="true">
                ▸
              </span>
              {s}
            </li>
          ))}
        </ol>
      );
  }
}

/* ------------------------------ cards ------------------------------ */

function SubjectCard({
  item,
  index,
  onPick,
}: {
  item: Showcase;
  index: number;
  onPick: (q: string) => void;
}) {
  const subject = subjectById(item.subject)!;

  return (
    <button
      type="button"
      onClick={() => onPick(item.question)}
      // Stagger the entrance so the grid assembles rather than snapping in.
      style={{
        animationDelay: `${index * 45}ms`,
        background: `color-mix(in oklab, var(--color-${subject.hue}) 7%, var(--color-surface))`,
        borderColor: `color-mix(in oklab, var(--color-${subject.hue}) 22%, var(--color-line))`,
      }}
      className="group animate-rise flex min-h-[9.5rem] flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-e3 focus-visible:-translate-y-1"
    >
      <div className="flex items-center gap-2">
        <span
          className="text-base leading-none"
          style={{ color: `var(--color-${subject.hue})` }}
          aria-hidden="true"
        >
          {subject.glyph}
        </span>
        <span
          className="text-[13px] font-semibold"
          style={{ color: `var(--color-${subject.hue})` }}
        >
          {subject.name}
        </span>
      </div>

      <p className="text-[13.5px] leading-snug font-medium text-ink">{item.teaser}</p>

      {/* The preview is the point: it shows the output type, live-rendered. */}
      <div className="mt-auto rounded-lg bg-surface/70 px-3 py-2.5">
        <PreviewBody preview={item.preview} hue={subject.hue} />
      </div>

      <span className="flex items-center gap-1 text-[12px] font-medium text-ink-3 transition-colors group-hover:text-ink-2">
        Use this question
        <span
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          →
        </span>
      </span>
    </button>
  );
}

/* ------------------------------ tools ------------------------------ */

const TOOLS = [
  { href: '/notes', glyph: '📓', label: 'Chapter notes' },
  { href: '/practice', glyph: '🎴', label: 'Flashcards' },
  { href: '/practice', glyph: '✓', label: 'Quiz me' },
  { href: '/subjects', glyph: '🧭', label: 'Browse subjects' },
  { href: '/saved', glyph: '🔖', label: 'Saved work' },
  { href: '/history', glyph: '🕘', label: 'My history' },
];

/* ---------------------------- anatomy ---------------------------- */

const ANATOMY = [
  { n: '1', label: 'What the question is really asking' },
  { n: '2', label: 'Numbered steps, each naming its rule' },
  { n: '3', label: 'Formulas rendered, diagram when it helps' },
  { n: '4', label: 'A check question only you can answer' },
];

export default function EntryGallery({
  onPick,
  hasDraft,
}: {
  onPick: (question: string) => void;
  /** Drives the "ready" state on the anatomy panel as the student types. */
  hasDraft: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Answer anatomy — sets expectation before the first question */}
      <section
        className={`animate-fade rounded-xl border p-4 transition-colors duration-300 sm:p-5 ${
          hasDraft ? 'border-brand/40 bg-brand-soft' : 'border-line bg-surface'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-overline text-ink-3 uppercase">
            {hasDraft ? 'Ready when you are' : "What you'll get back"}
          </h2>
          {hasDraft && (
            <span className="animate-fade text-[12px] font-medium text-brand">
              Press ⌘↵ to send
            </span>
          )}
        </div>

        <ol className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {ANATOMY.map((row, i) => (
            <li
              key={row.n}
              className="animate-rise flex gap-2.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors duration-300 ${
                  hasDraft ? 'bg-brand text-white' : 'bg-sunken text-ink-3'
                }`}
              >
                {row.n}
              </span>
              <span className="text-[12.5px] leading-snug text-ink-2">{row.label}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Subject showcase */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-h3 text-ink">Or start from a real question</h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Each one shows the kind of answer that subject gets back.
            </p>
          </div>
          <a
            href="/subjects"
            className="text-sm font-medium text-brand transition-colors hover:text-brand-hover"
          >
            All subjects →
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE.map((item, i) => (
            <SubjectCard key={item.subject} item={item} index={i} onPick={onPick} />
          ))}
        </div>
      </section>

      {/* Tools + the honest line about what we don't build */}
      <section className="space-y-3">
        <h2 className="text-overline text-ink-3 uppercase">The rest of your desk</h2>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((tool) => (
            <a
              key={tool.label}
              href={tool.href}
              className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow-e1"
            >
              <span aria-hidden="true">{tool.glyph}</span>
              {tool.label}
            </a>
          ))}
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          You won't find an essay “humanizer” or an AI detector here. Tools built to
          disguise work are the reason this whole category gets blocked —{' '}
          <a href="/for-teachers" className="text-ink-2 underline underline-offset-2 hover:text-ink">
            why that matters
          </a>
          .
        </p>
      </section>
    </div>
  );
}
