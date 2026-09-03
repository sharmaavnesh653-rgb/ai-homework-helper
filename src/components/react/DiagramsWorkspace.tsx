import { useState } from 'react';
import VisualBlock from './VisualBlock';
import type { Visual } from '../../lib/types';
import { saveNote } from '../../lib/storage';

const SAMPLE_DIAGRAMS: Record<string, Visual> = {
  photosynthesis: {
    kind: 'concept-map',
    caption: 'Photosynthesis Overview & Light Reactions',
    nodes: [
      { id: '1', label: 'Photosynthesis' },
      { id: '2', label: 'Light Reactions (Thylakoids)' },
      { id: '3', label: 'Calvin Cycle (Stroma)' },
      { id: '4', label: 'H2O + Light → O2 + ATP' },
      { id: '5', label: 'CO2 + ATP → Glucose' },
    ],
    links: [
      { from: '1', to: '2', label: 'Phase 1' },
      { from: '1', to: '3', label: 'Phase 2' },
      { from: '2', to: '4', label: 'Splits water' },
      { from: '3', to: '5', label: 'Fixes carbon' },
    ],
  },
  kinematics: {
    kind: 'chart',
    chartType: 'line',
    caption: 'Velocity vs Time (Constant Acceleration)',
    xLabel: 'Time (s)',
    yLabel: 'Velocity (m/s)',
    series: [
      {
        name: 'v(t) = v0 + at',
        points: [
          { x: 0, y: 10 },
          { x: 2, y: 19.8 },
          { x: 4, y: 29.6 },
          { x: 6, y: 39.4 },
          { x: 8, y: 49.2 },
        ],
      },
    ],
  },
  cell_mitosis: {
    kind: 'labelled',
    caption: 'Key Stages of Cell Mitosis',
    subject: 'Biology — Cell Division',
    parts: [
      { label: 'Prophase', describes: 'Chromatin condenses into visible chromosomes; nuclear envelope breaks down.' },
      { label: 'Metaphase', describes: 'Chromosomes line up along the equatorial metaphase plate.' },
      { label: 'Anaphase', describes: 'Sister chromatids separate toward opposite poles of the spindle.' },
      { label: 'Telophase', describes: 'Nuclear membranes reform around separated sister chromosomes.' },
    ],
  },
  history_timeline: {
    kind: 'table',
    caption: 'French Revolution Key Milestones',
    columns: ['Year', 'Event', 'Impact'],
    rows: [
      ['1789', 'Estates-General & Storming of Bastille', 'End of absolute monarchy, Declaration of Rights'],
      ['1792', 'Proclamation of First Republic', 'Abolition of the French monarchy'],
      ['1793-1794', 'Reign of Terror', 'Radical phase led by Jacobins'],
      ['1799', 'Coup of 18 Brumaire', 'Napoleon Bonaparte rises to power'],
    ],
  },
};

export default function DiagramsWorkspace() {
  const [topic, setTopic] = useState('');
  const [diagramType, setDiagramType] = useState<'concept-map' | 'chart' | 'table' | 'labelled'>('concept-map');
  const [currentVisual, setCurrentVisual] = useState<Visual>(SAMPLE_DIAGRAMS.photosynthesis);
  const [loading, setLoading] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSavedLabel(null);

    setTimeout(() => {
      // Custom visual generation mapping
      if (diagramType === 'table') {
        setCurrentVisual({
          kind: 'table',
          caption: `Structured Breakdown: ${topic}`,
          columns: ['Component', 'Role / Definition', 'Key Formula or Fact'],
          rows: [
            ['Primary Input', `Initial parameters for ${topic}`, 'Standard Condition'],
            ['Transformation', 'Core mechanism & process steps', 'Rate equation'],
            ['Final Output', 'Resulting product / outcome', 'Conservation law'],
          ],
        });
      } else if (diagramType === 'chart') {
        setCurrentVisual({
          kind: 'chart',
          chartType: 'line',
          caption: `Quantitative Trend for ${topic}`,
          xLabel: 'Time / Input Parameter',
          yLabel: 'Output Magnitude',
          series: [
            {
              name: topic,
              points: [
                { x: 1, y: 15 },
                { x: 2, y: 28 },
                { x: 3, y: 45 },
                { x: 4, y: 62 },
                { x: 5, y: 85 },
              ],
            },
          ],
        });
      } else if (diagramType === 'labelled') {
        setCurrentVisual({
          kind: 'labelled',
          caption: `Structural Diagram of ${topic}`,
          subject: topic,
          parts: [
            { label: 'Core System', describes: `Primary structure responsible for ${topic}` },
            { label: 'Input Mechanism', describes: 'Channels raw data or energy into the process' },
            { label: 'Feedback Loop', describes: 'Regulates equilibrium and prevents breakdown' },
          ],
        });
      } else {
        setCurrentVisual({
          kind: 'concept-map',
          caption: `MindMap Overview of ${topic}`,
          nodes: [
            { id: '1', label: topic },
            { id: '2', label: 'Foundational Principles' },
            { id: '3', label: 'Key Equations / Laws' },
            { id: '4', label: 'Real-World Applications' },
            { id: '5', label: 'Common Misconceptions' },
          ],
          links: [
            { from: '1', to: '2', label: 'Governed by' },
            { from: '1', to: '3', label: 'Expressed as' },
            { from: '1', to: '4', label: 'Applied in' },
            { from: '1', to: '5', label: 'Avoid mistaking' },
          ],
        });
      }
      setLoading(false);
    }, 500);
  };

  const handleSaveDiagram = () => {
    saveNote({
      title: `Diagram: ${currentVisual.caption ?? topic ?? 'Visual Concept'}`,
      body: `Visual Diagram (${currentVisual.kind}): ${currentVisual.caption ?? 'Study visual'}`,
    });
    setSavedLabel('Saved to Library ✓');
    setTimeout(() => setSavedLabel(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2 border-b border-line pb-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand font-bold text-sm">
            V
          </span>
          <h1 className="text-h2 font-bold text-ink">Diagrams & Concept Maps</h1>
        </div>
        <p className="text-sm text-ink-2 max-w-2xl">
          Transform any topic, formula, or history event into structured visual mindmaps, flowcharts, timelines, and labelled diagrams.
        </p>
      </div>

      {/* Generator Form */}
      <div className="rounded-xl border border-line bg-surface p-5 shadow-e1 space-y-4">
        <label htmlFor="topic-input" className="block text-xs font-bold uppercase tracking-wider text-ink-3">
          Topic or Question to Visualize
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Pythagorean Theorem, French Revolution, Mitosis..."
            className="flex-1 rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-e2 transition-all hover:bg-brand-hover active:translate-y-px disabled:opacity-50 shrink-0"
          >
            {loading ? 'Generating...' : 'Generate Visual'}
          </button>
        </div>

        {/* Diagram Type Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
          <span className="text-xs font-semibold text-ink-3">Format:</span>
          {[
            { id: 'concept-map', label: 'Concept Map' },
            { id: 'labelled', label: 'Labelled Diagram' },
            { id: 'table', label: 'Comparison Table / Timeline' },
            { id: 'chart', label: 'Quantitative Graph' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setDiagramType(type.id as any)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                diagramType === type.id
                  ? 'border-brand bg-brand-soft text-brand shadow-sm'
                  : 'border-line bg-canvas text-ink-2 hover:border-line-strong hover:text-ink'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Starters */}
      <div className="space-y-2">
        <span className="text-overline text-ink-3 uppercase">Try an example visual</span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Photosynthesis Process', key: 'photosynthesis' },
            { label: 'Kinematics Graph', key: 'kinematics' },
            { label: 'Stages of Mitosis', key: 'cell_mitosis' },
            { label: 'French Revolution Timeline', key: 'history_timeline' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setCurrentVisual(SAMPLE_DIAGRAMS[p.key]);
                setTopic(p.label);
              }}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-2 hover:border-brand/40 hover:bg-brand-soft hover:text-brand transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Block Stage */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-e2 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="text-base font-bold text-ink">{currentVisual.caption ?? 'Visual Representation'}</h3>
            <span className="text-xs text-ink-3 uppercase font-mono">{currentVisual.kind} format</span>
          </div>

          <button
            type="button"
            onClick={handleSaveDiagram}
            className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-brand hover:text-brand transition-colors"
          >
            {savedLabel ?? 'Save to Library'}
          </button>
        </div>

        <div className="py-2">
          <VisualBlock visual={currentVisual} />
        </div>
      </div>
    </div>
  );
}
