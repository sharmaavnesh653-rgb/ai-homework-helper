import { useState } from 'react';
import VisualBlock from './VisualBlock';
import type { Visual } from '../../lib/types';
import { saveNote } from '../../lib/storage';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Sliders,
  Sparkles,
  Bookmark,
  Compass,
  Table,
  LineChart,
  Network,
  Layers
} from 'lucide-react';

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
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1 font-mono text-xs">
            <Sliders className="h-3.5 w-3.5" />
            <span>Visual Learning</span>
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">Diagrams & Concept Maps</h1>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
          Transform complex topics, equations, or history timelines into visual flowcharts, labelled diagrams, and concept maps.
        </p>
      </div>

      {/* Generator Form Card */}
      <Card className="p-5 border-zinc-800 bg-zinc-950/90 shadow-2xl space-y-4 backdrop-blur-md">
        <label htmlFor="topic-input" className="block text-xs font-mono font-bold text-zinc-400 uppercase">
          Topic or Question to Visualize
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Pythagorean Theorem, French Revolution, Mitosis..."
            className="flex-1 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 shrink-0 gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? 'Generating...' : 'Generate Visual'}</span>
          </Button>
        </div>

        {/* Diagram Type Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
          <span className="text-xs font-mono text-zinc-400 font-bold">Format:</span>
          {[
            { id: 'concept-map', label: 'Concept Map', icon: Network },
            { id: 'labelled', label: 'Labelled Diagram', icon: Layers },
            { id: 'table', label: 'Timeline / Table', icon: Table },
            { id: 'chart', label: 'Quantitative Graph', icon: LineChart },
          ].map((type) => {
            const Icon = type.icon;
            const active = diagramType === type.id;
            return (
              <Button
                key={type.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDiagramType(type.id as any)}
                className={`h-8 gap-1.5 text-xs ${
                  active
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{type.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Preset Starters */}
      <div className="space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 block">Try an example visual:</span>
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
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:text-emerald-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Block Stage Card */}
      <Card className="p-6 border-zinc-800 bg-zinc-950 shadow-2xl space-y-4">
        <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold text-zinc-100">{currentVisual.caption ?? 'Visual Representation'}</CardTitle>
            <CardDescription className="uppercase font-mono text-[10px] text-emerald-400 mt-1">{currentVisual.kind} format</CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDiagram}
            className="border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 gap-1.5"
          >
            <Bookmark className="h-3.5 w-3.5 text-emerald-400" />
            <span>{savedLabel ?? 'Save to Library'}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0 py-2">
          <VisualBlock visual={currentVisual} />
        </CardContent>
      </Card>
    </div>
  );
}
