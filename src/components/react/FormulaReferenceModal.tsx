import { useState } from 'react';
import Formula from './Formula';

interface FormulaCategory {
  name: string;
  items: { label: string; latex: string; note?: string }[];
}

const CATEGORIES: FormulaCategory[] = [
  {
    name: 'Algebra & Calculus',
    items: [
      { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { label: 'Power Rule (Derivative)', latex: '\\frac{d}{dx}[x^n] = n x^{n-1}' },
      { label: 'Logarithm Identity', latex: '\\log_b(xy) = \\log_b(x) + \\log_b(y)' },
      { label: 'Integration by Parts', latex: '\\int u \\, dv = uv - \\int v \\, du' },
    ],
  },
  {
    name: 'Physics & Kinematics',
    items: [
      { label: 'Velocity-Time (Kinematics)', latex: 'v = v_0 + a t' },
      { label: 'Displacement (Kinematics)', latex: '\\Delta x = v_0 t + \\frac{1}{2} a t^2' },
      { label: 'Newton’s Second Law', latex: 'F = m a' },
      { label: 'Work-Energy Theorem', latex: 'W = \\Delta K = \\frac{1}{2} m v^2 - \\frac{1}{2} m v_0^2' },
    ],
  },
  {
    name: 'Geometry & Trig',
    items: [
      { label: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
      { label: 'Sine Rule', latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}' },
      { label: 'Cosine Rule', latex: 'c^2 = a^2 + b^2 - 2ab \\cos C' },
      { label: 'Circle Area', latex: 'A = \\pi r^2' },
    ],
  },
  {
    name: 'Chemistry & Gas Laws',
    items: [
      { label: 'Ideal Gas Law', latex: 'P V = n R T' },
      { label: 'Molarity', latex: 'M = \\frac{\\text{moles of solute}}{\\text{liters of solution}}' },
      { label: 'pH Formula', latex: '\\text{pH} = -\\log[H^+]' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormula?: (latex: string) => void;
}

export default function FormulaReferenceModal({ isOpen, onClose, onSelectFormula }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedTex, setCopiedTex] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (latex: string) => {
    if (onSelectFormula) {
      onSelectFormula(latex);
      onClose();
      return;
    }
    navigator.clipboard.writeText(latex);
    setCopiedTex(latex);
    setTimeout(() => setCopiedTex(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-e4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-sunken/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand font-semibold text-sm">
              ∑
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink">Formula & Reference Cheat-Sheet</h3>
              <p className="text-xs text-ink-3">Quick formulas & KaTeX snippets for problem solving</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-sunken hover:text-ink transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line overflow-x-auto scroll-slim px-4 pt-2 bg-canvas">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-3 hover:text-ink-2'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Formula list */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 scroll-slim bg-surface">
          {CATEGORIES[activeTab].items.map((item) => (
            <div
              key={item.label}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4 transition-all hover:border-brand/40 hover:shadow-e1"
            >
              <div className="space-y-1.5 min-w-0">
                <span className="text-xs font-semibold text-ink-2">{item.label}</span>
                <div className="scroll-slim overflow-x-auto rounded-lg bg-sunken px-3.5 py-2">
                  <Formula tex={item.latex} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.latex)}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
              >
                {copiedTex === item.latex ? (
                  <span className="text-ok">Copied ✓</span>
                ) : onSelectFormula ? (
                  'Insert'
                ) : (
                  'Copy TeX'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-sunken/40 px-6 py-3 text-xs text-ink-3">
          <span>Click Insert or Copy TeX to paste into your question input.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface border border-line px-3 py-1.5 font-medium text-ink hover:bg-sunken"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
