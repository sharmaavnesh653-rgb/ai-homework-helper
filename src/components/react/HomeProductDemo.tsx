import { useState } from 'react';
import Formula from './Formula';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Bookmark,
  Layers,
  FileText,
  Sliders,
  Play,
  RotateCcw
} from 'lucide-react';

const DEMO_STEPS = [
  { id: 'question', label: '1. Question', icon: HelpCircle },
  { id: 'explanation', label: '2. AI Explanation', icon: Sparkles },
  { id: 'visual', label: '3. Visual Example', icon: Sliders },
  { id: 'practice', label: '4. Practice', icon: Layers },
  { id: 'save', label: '5. Save & Revise', icon: Bookmark },
];

export default function HomeProductDemo() {
  const [activeStep, setActiveStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 shadow-2xl overflow-hidden rounded-2xl backdrop-blur-xl">
      {/* App Window Title Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono text-zinc-400 ml-2 font-medium">
            Stepwise Studio — Interactive Workspace Demo
          </span>
        </div>

        {/* Step Indicator Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          {DEMO_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const stepNum = idx + 1;
            const active = activeStep === stepNum;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(stepNum)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Demo Area */}
      <CardContent className="p-6 space-y-6">
        {/* STEP 1: QUESTION */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-fade">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Student Question</span>
              </Badge>
              <span className="text-xs font-mono text-zinc-400">Physics 101 · Kinematics</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                "A ball is kicked from ground level with an initial velocity of 20 m/s at an angle of 30° above the horizontal. How high does it reach at its peak?"
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs font-mono text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Attached: projectile_diagram.png (120 KB)</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setActiveStep(2)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
              >
                <span>See Step-by-Step AI Solution</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: AI EXPLANATION */}
        {activeStep === 2 && (
          <div className="space-y-5 animate-fade">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Stepwise Structured Answer</span>
              </Badge>
              <span className="text-xs font-mono text-zinc-400">Verified Physics Derivation</span>
            </div>

            {/* Answer Summary Card */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400">Direct Answer</span>
              <p className="text-sm font-bold text-zinc-100">
                The ball reaches a maximum peak height of <span className="text-emerald-400 font-mono font-extrabold">5.10 meters</span>.
              </p>
            </div>

            {/* Step 1 Derivation */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200">1. Vertical Velocity Component Resolution</h4>
                <span className="text-[10px] font-mono text-emerald-400">v_y = v_0 * sin(θ)</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Isolate initial vertical speed v_0y:
              </p>
              <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 font-mono text-xs text-zinc-200">
                <Formula tex="v_{0y} = 20 \cdot \sin(30^\circ) = 20 \cdot 0.5 = 10 \text{ m/s}" />
              </div>
            </div>

            {/* Step 2 Peak Height */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200">2. Apply Peak Kinematic Formula</h4>
                <span className="text-[10px] font-mono text-emerald-400">h = v_y^2 / (2g)</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                At peak apex height, vertical velocity v_y = 0. Using v_y^2 = v_0y^2 - 2gh:
              </p>
              <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 font-mono text-xs text-zinc-200">
                <Formula tex="h_{\text{max}} = \frac{10^2}{2 \cdot 9.8} = \frac{100}{19.6} \approx 5.10 \text{ m}" />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(1)}
                className="border-zinc-800 bg-zinc-900 text-xs text-zinc-300"
              >
                Back
              </Button>

              <Button
                onClick={() => setActiveStep(3)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
              >
                <span>View Interactive Visual Diagram</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: VISUAL EXAMPLE */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-fade">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1">
                <Sliders className="h-3.5 w-3.5" />
                <span>Interactive Trajectory Diagram</span>
              </Badge>
              <span className="text-xs font-mono text-zinc-400">Parabolic Motion Visualizer</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 text-center">
              <svg viewBox="0 0 400 160" className="w-full max-w-lg mx-auto overflow-visible">
                {/* Ground Line */}
                <line x1="20" y1="140" x2="380" y2="140" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Parabolic Trajectory Path */}
                <path
                  d="M 40 140 Q 200 20 360 140"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />

                {/* Peak Point Indicator */}
                <circle cx="200" cy="40" r="6" fill="#10b981" className="animate-pulse" />
                <line x1="200" y1="40" x2="200" y2="140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="208" y="75" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">h_max = 5.10m (v_y = 0)</text>

                {/* Launch Vector */}
                <line x1="40" y1="140" x2="100" y2="90" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="45" y="80" fill="#38bdf8" fontSize="10" fontFamily="monospace">v_0 = 20 m/s (30°)</text>
              </svg>

              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Notice how horizontal velocity remains constant throughout flight while vertical velocity decelerates to 0 at peak apex height.
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(2)}
                className="border-zinc-800 bg-zinc-900 text-xs text-zinc-300"
              >
                Back
              </Button>

              <Button
                onClick={() => setActiveStep(4)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
              >
                <span>Test Misconception Quiz</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: PRACTICE */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fade">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1">
                <Layers className="h-3.5 w-3.5" />
                <span>Misconception Practice Quiz</span>
              </Badge>
              <span className="text-xs font-mono text-zinc-400">Check Your Recall</span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
              <h4 className="text-xs font-bold text-zinc-100">
                Question: At the maximum peak height of any projectile, which parameter is strictly zero?
              </h4>

              <div className="grid gap-2.5">
                {[
                  'Horizontal velocity (v_x)',
                  'Vertical velocity (v_y)',
                  'Total gravitational force (F_g)',
                  'Horizontal acceleration (a_x)'
                ].map((opt, idx) => {
                  const selected = quizAnswer === idx;
                  const isCorrect = idx === 1;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQuizAnswer(idx)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-xs font-medium transition-all text-left ${
                        selected
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                            : 'border-red-500 bg-red-950/40 text-red-300'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {selected && (
                        <span>{isCorrect ? '✓ Correct!' : '✕ Try again'}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {quizAnswer !== null && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-lg leading-relaxed">
                  ✓ Exactly! Vertical velocity drops to 0 at apex before accelerating back downward. Horizontal velocity remains constant.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(3)}
                className="border-zinc-800 bg-zinc-900 text-xs text-zinc-300"
              >
                Back
              </Button>

              <Button
                onClick={() => setActiveStep(5)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
              >
                <span>Save to Revision Notes</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: SAVE */}
        {activeStep === 5 && (
          <div className="space-y-4 animate-fade text-center py-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 mx-auto">
              <Bookmark className="h-6 w-6" />
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-zinc-100">Saved to Your Personal Study Library</h3>
              <p className="text-xs text-zinc-400">
                Physics_Kinematics_Apex_Height.note · Saved with interactive formulas & quiz recall.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => {
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold"
              >
                <Bookmark className="h-4 w-4" />
                <span>{saved ? '✓ Saved to Library' : 'Save Solution'}</span>
              </Button>

              <a
                href="/solve"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                <span>Launch Full Solver</span>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
