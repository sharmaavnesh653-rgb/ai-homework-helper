import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import Formula from './Formula';
import ThemeToggle from './ThemeToggle';
import TypewriterHeading from './TypewriterHeading';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Share2,
  Download,
  Copy,
  Check,
  Search,
  Zap,
  Layers,
  ListOrdered,
  ChevronRight,
  ChevronLeft,
  Volume2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Sliders
} from 'lucide-react';

interface Timestamp {
  time: string;
  seconds: number;
  label: string;
  snippet: string;
}

const SAMPLE_TIMESTAMPS: Timestamp[] = [
  { time: '00:45', seconds: 45, label: 'Vector Decomposition', snippet: 'Decoupling horizontal v_x and vertical v_y velocities' },
  { time: '02:15', seconds: 135, label: 'Kinematic Formulas', snippet: 'Choosing v_y = v_0 * sin(theta) for maximum height' },
  { time: '05:30', seconds: 330, label: 'Step-by-Step Derivation', snippet: 'Substituting parameters into h_max formula' },
  { time: '08:10', seconds: 490, label: 'Sanity Check & Limits', snippet: 'Verifying dimensional consistency and zero angle limit' },
];

const FLASHCARDS = [
  {
    id: 1,
    question: 'Why does horizontal velocity remain constant in ideal projectile motion?',
    answer: 'Because gravity acts purely vertically (downward), making horizontal acceleration a_x = 0 m/s^2 when air resistance is neglected.',
    topic: 'Kinematics'
  },
  {
    id: 2,
    question: 'What is the vertical velocity at the maximum apex height?',
    answer: 'At peak height, vertical velocity v_y = 0 m/s momentarily before changing direction and descending.',
    topic: 'Trajectory Peak'
  },
  {
    id: 3,
    question: 'What angle maximizes horizontal range on flat ground?',
    answer: 'A launch angle of 45° provides the optimal balance between horizontal velocity and air hang-time.',
    topic: 'Range Optimization'
  },
];

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'A ball is thrown with initial speed 20 m/s at 30° above horizontal. What is its initial vertical velocity component?',
    options: ['10 m/s', '17.3 m/s', '20 m/s', '5 m/s'],
    correct: 0,
    explanation: 'v_y = v_0 * sin(30°) = 20 * 0.5 = 10 m/s.'
  },
  {
    id: 2,
    question: 'At the highest point of a projectile trajectory, which vector is zero?',
    options: ['Horizontal acceleration', 'Vertical velocity', 'Total displacement', 'Gravitational force'],
    correct: 1,
    explanation: 'At the apex, vertical velocity drops to zero before changing direction.'
  }
];

const FORMULAS = [
  { topic: 'Kinematics', tex: 'v_y = v_0 \\sin\\theta - gt', label: 'Vertical Velocity' },
  { topic: 'Kinematics', tex: 'h_{\\text{max}} = \\frac{v_0^2 \\sin^2\\theta}{2g}', label: 'Maximum Peak Height' },
  { topic: 'Kinematics', tex: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}', label: 'Horizontal Range' },
  { topic: 'Dynamics', tex: 'F_{\\text{net}} = m \\cdot a', label: 'Newton\'s Second Law' },
];

export default function NoteGPTWorkspace() {
  // Navigation & Workspace states
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'diagram' | 'quiz' | 'formulas' | 'notes' | 'chat'>('summary');
  const [leftTab, setLeftTab] = useState<'media' | 'transcript' | 'file'>('media');

  // Audio / Video player interactive states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const duration = 540; // 9 minutes

  // Flashcards states
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<number[]>([]);

  // Diagram states
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>('1');

  // Quiz states
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // Formulas search state
  const [formulaSearch, setFormulaSearch] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  // Markdown Notes states
  const [customNotes, setCustomNotes] = useState(
    '# Physics Kinematics - Class Summary\n\n## Core Principles\n- **Horizontal Motion**: Constant speed ($v_x = v_0 \\cos\\theta$), acceleration $a_x = 0$.\n- **Vertical Motion**: Free-fall acceleration ($a_y = -g = -9.81 \\text{ m/s}^2$).\n\n## Peak Condition\nAt peak height ($h_{\\text{max}}$), vertical velocity $v_y = 0 \\text{ m/s}$.'
  );
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  // Chat Q&A states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; time: string }>>([
    { role: 'ai', text: 'Hello! I have generated full step-by-step summary, flashcards, and concept maps for this physics lesson. What topic would you like to test or review?', time: '10:45 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Auto-timer for simulated audio playback
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => (prev >= duration ? 0 : prev + 1));
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const handleTimestampClick = (seconds: number) => {
    setCurrentTime(seconds);
    setLeftTab('media');
    setIsPlaying(true);
  };

  const handleToggleMastered = (id: number) => {
    if (masteredCards.includes(id)) {
      setMasteredCards(masteredCards.filter((c) => c !== id));
    } else {
      setMasteredCards([...masteredCards, id]);
    }
  };

  const handleCopyFormula = (tex: string) => {
    navigator.clipboard.writeText(tex);
    setCopiedFormula(tex);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const handleSaveNotes = () => {
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg, time: timeStr }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Regarding "${userMsg}": In two-dimensional kinematics, remember that orthogonal vectors act independently. You can analyze horizontal distance x = v_x * t completely separate from vertical displacement y = v_0y*t - 0.5*g*t^2.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredFormulas = FORMULAS.filter((f) =>
    f.label.toLowerCase().includes(formulaSearch.toLowerCase()) ||
    f.topic.toLowerCase().includes(formulaSearch.toLowerCase()) ||
    f.tex.toLowerCase().includes(formulaSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-emerald-500/30">
      
      {/* TOP HEADER / NAVBAR */}
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 sm:px-6 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 font-extrabold text-white shadow-sm">
              S
            </span>
            <span className="text-sm font-extrabold tracking-tight text-zinc-100 hidden sm:inline-block">
              Stepwise <span className="text-xs font-normal text-zinc-400">Studio</span>
            </span>
          </a>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Project Title Badge */}
          <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="max-w-[160px] truncate sm:max-w-[240px]">Physics 101: Kinematics & Vectors</span>
          </div>
        </div>

        {/* Center: Action Switchers */}
        <div className="hidden md:flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          {[
            { id: 'summary', label: 'Summary', icon: BookOpen },
            { id: 'flashcards', label: 'Flashcards', icon: Layers },
            { id: 'diagram', label: 'Diagram', icon: Sliders },
            { id: 'quiz', label: 'Quiz', icon: HelpCircle },
            { id: 'notes', label: 'Editor', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Export & Theme */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveNotes}
            className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Notes</span>
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Toast Notification */}
      {noteSavedToast && (
        <div className="absolute top-16 right-6 z-50 animate-bounce rounded-lg border border-emerald-500/30 bg-emerald-950 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-lg">
          ✓ Notes saved to local workspace
        </div>
      )}

      {/* MAIN SPLIT-SCREEN WORKSPACE */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: MEDIA & SOURCE WORKSPACE (42% Width) */}
        <section className="flex flex-col border-r border-zinc-800 bg-zinc-950/60 w-full lg:w-[42%] shrink-0 overflow-hidden">
          
          {/* Header Tab Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2">
            <div className="flex gap-1 rounded-md bg-zinc-950 p-1 border border-zinc-800/60">
              {[
                { id: 'media', label: 'Video Player' },
                { id: 'transcript', label: 'Transcript' },
                { id: 'file', label: 'Attached Notes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftTab(tab.id as any)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    leftTab === tab.id
                      ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-zinc-400">1080p HD</span>
          </div>

          {/* Left Main Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-slim">
            
            {leftTab === 'media' && (
              <div className="space-y-4">
                {/* YouTube Video Player Embed */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/gT8E6Mmsv4U?start=${currentTime}&autoplay=0`}
                    title="Physics Kinematics Lecture"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Custom Interactive Audio Sync Controller */}
                <Card className="border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </Button>

                      <div>
                        <p className="text-xs font-semibold text-zinc-100">MIT 8.01 Kinematics Audio</p>
                        <p className="text-[11px] font-mono text-zinc-400">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                      </div>
                    </div>

                    {/* Playback speed toggle */}
                    <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 p-0.5">
                      {[1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold transition-all ${
                            playbackSpeed === spd
                              ? 'bg-emerald-600 text-white'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Waveform / Progress bar */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={currentTime}
                      onChange={(e) => setCurrentTime(Number(e.target.value))}
                      className="w-full h-1.5 accent-emerald-500 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </Card>
              </div>
            )}

            {leftTab === 'transcript' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 border-b border-zinc-800 pb-2 px-1">
                  <span>Interactive Timestamps</span>
                  <span>Click line to jump</span>
                </div>
                <div className="space-y-2">
                  {SAMPLE_TIMESTAMPS.map((t) => (
                    <div
                      key={t.time}
                      onClick={() => handleTimestampClick(t.seconds)}
                      className={`group flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                        currentTime >= t.seconds && currentTime < t.seconds + 90
                          ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                          : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-500/30 shrink-0">
                        {t.time}
                      </Badge>
                      <div>
                        <h5 className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                          {t.label}
                        </h5>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{t.snippet}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'file' && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-zinc-200">Lecture Slides / Textbook PDF Attached</h4>
                <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                  Physics_Chapter_2_Kinematics.pdf (4.2 MB) · Analyzed by Stepwise Engine.
                </p>
              </div>
            )}
          </div>

          {/* Left Bottom Quick Jump Bar */}
          <div className="border-t border-zinc-800 bg-zinc-900/80 p-3 space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Key Video Timestamps
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TIMESTAMPS.map((t) => (
                <button
                  key={t.time}
                  type="button"
                  onClick={() => handleTimestampClick(t.seconds)}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-mono font-medium transition-all ${
                    currentTime === t.seconds
                      ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>▶ {t.time}</span>
                  <span className="max-w-[80px] truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: AI TOOLS & WORKSPACE (58% Width) */}
        <section className="flex flex-col flex-1 bg-zinc-950 overflow-hidden">
          
          {/* Main Action Tabs Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 gap-2 shrink-0 z-10">
            <div className="flex gap-1 overflow-x-auto scroll-slim">
              {[
                { id: 'summary', label: 'Summary' },
                { id: 'flashcards', label: 'Flashcards' },
                { id: 'diagram', label: 'Concept Diagram' },
                { id: 'quiz', label: 'Quiz' },
                { id: 'formulas', label: 'Formulas' },
                { id: 'notes', label: 'Notes Editor' },
                { id: 'chat', label: 'AI Tutor Q&A' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Body View Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-slim">
            
            {/* TAB 1: SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-4 animate-fade">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 mb-2 shadow-inner">
                  <TypewriterHeading />
                </div>
                <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/30">
                      Executive Summary
                    </Badge>
                    <span className="text-[11px] font-mono text-zinc-400">98% Accuracy · Verified Formula</span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-200 font-medium">
                    This lecture derives orthogonal vector kinematics for projectile motion under gravitational acceleration. It isolates horizontal uniform velocity (v_x = constant) from vertical free-fall acceleration (a_y = -g).
                  </p>
                </Card>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Derivation Steps</h4>

                  <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-100">1. Vector Velocity Resolution</h5>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTimestampClick(45)}
                        className="h-6 text-[11px] font-mono text-emerald-400 hover:text-emerald-300"
                      >
                        ▶ 00:45
                      </Button>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      Initial speed $v_0$ at launch angle $\theta$ splits into component vectors:
                    </p>
                    <div className="rounded-md bg-zinc-950 p-2 border border-zinc-800">
                      <Formula tex="v_x = v_0 \cos\theta, \quad v_y = v_0 \sin\theta - g t" />
                    </div>
                  </Card>

                  <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-100">2. Peak Height Derivation</h5>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTimestampClick(330)}
                        className="h-6 text-[11px] font-mono text-emerald-400 hover:text-emerald-300"
                      >
                        ▶ 05:30
                      </Button>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      At maximum peak height, vertical velocity drops to zero ($v_y = 0$). Substituting yields:
                    </p>
                    <div className="rounded-md bg-zinc-950 p-2 border border-zinc-800">
                      <Formula tex="h_{\text{max}} = \frac{v_0^2 \sin^2\theta}{2g}" />
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 2: FLASHCARDS */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4 animate-fade">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-zinc-800 text-zinc-300">
                    Card {cardIndex + 1} of {FLASHCARDS.length}
                  </Badge>

                  <span className="text-xs text-emerald-400 font-semibold">
                    {masteredCards.length} Mastered
                  </span>
                </div>

                {/* 3D Flip Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="group relative min-h-[220px] w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl transition-all duration-300 hover:border-emerald-500/40 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {FLASHCARDS[cardIndex].topic}
                    </Badge>
                    <span className="text-[11px] text-zinc-400">Click to {isFlipped ? 'show question' : 'flip answer'}</span>
                  </div>

                  <div className="my-6 text-center">
                    {!isFlipped ? (
                      <p className="text-sm font-bold text-zinc-100 leading-relaxed">
                        {FLASHCARDS[cardIndex].question}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Answer</p>
                        <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                          {FLASHCARDS[cardIndex].answer}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
                    <span>Active Recall</span>
                    <span className="text-emerald-400 font-medium">Tap Card ↺</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cardIndex === 0}
                    onClick={() => { setCardIndex(cardIndex - 1); setIsFlipped(false); }}
                    className="border-zinc-800 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>

                  <Button
                    variant={masteredCards.includes(FLASHCARDS[cardIndex].id) ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleMastered(FLASHCARDS[cardIndex].id)}
                    className="border-zinc-800 text-xs text-emerald-400 hover:bg-zinc-800"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {masteredCards.includes(FLASHCARDS[cardIndex].id) ? 'Mastered ✓' : 'Mark Mastered'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cardIndex === FLASHCARDS.length - 1}
                    onClick={() => { setCardIndex(cardIndex + 1); setIsFlipped(false); }}
                    className="border-zinc-800 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: CONCEPT DIAGRAM */}
            {activeTab === 'diagram' && (
              <div className="space-y-4 animate-fade">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                      Visual Concept Map
                    </Badge>
                    <span className="text-xs text-zinc-400">Zoom: {zoomLevel}%</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                      className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-300"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
                      className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-300"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setZoomLevel(100)}
                      className="h-7 w-7 border-zinc-800 bg-zinc-900 text-zinc-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* SVG Visual Diagram Box */}
                <Card className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 0.2s ease-out' }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div
                      onClick={() => setSelectedNode('1')}
                      className={`cursor-pointer rounded-xl border px-6 py-3 text-xs font-extrabold shadow-md transition-all ${
                        selectedNode === '1'
                          ? 'border-emerald-500 bg-emerald-950 text-emerald-200 ring-2 ring-emerald-500/30'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-emerald-500/50'
                      }`}
                    >
                      Kinematics (2D Motion)
                    </div>

                    <div className="h-6 w-0.5 bg-zinc-700" />

                    <div className="grid grid-cols-2 gap-8">
                      <div
                        onClick={() => setSelectedNode('2')}
                        className={`cursor-pointer rounded-xl border p-4 text-xs font-semibold text-center transition-all ${
                          selectedNode === '2'
                            ? 'border-emerald-500 bg-emerald-950 text-emerald-200 ring-2 ring-emerald-500/30'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <p className="font-bold">Horizontal Axis (X)</p>
                        <p className="text-[11px] text-zinc-400 mt-1">a_x = 0, v_x = const</p>
                      </div>

                      <div
                        onClick={() => setSelectedNode('3')}
                        className={`cursor-pointer rounded-xl border p-4 text-xs font-semibold text-center transition-all ${
                          selectedNode === '3'
                            ? 'border-emerald-500 bg-emerald-950 text-emerald-200 ring-2 ring-emerald-500/30'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <p className="font-bold">Vertical Axis (Y)</p>
                        <p className="text-[11px] text-zinc-400 mt-1">a_y = -g, Peak v_y = 0</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Node Inspector Card */}
                {selectedNode && (
                  <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1.5">
                    <h5 className="text-xs font-bold text-emerald-400">
                      Node Details: {selectedNode === '1' ? 'Kinematics' : selectedNode === '2' ? 'Horizontal Axis' : 'Vertical Axis'}
                    </h5>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {selectedNode === '1' && 'Two-dimensional projectile motion decouples into independent 1D motions along perpendicular axes.'}
                      {selectedNode === '2' && 'Since gravity pulls strictly downward, there is no force in the horizontal direction. Thus v_x remains constant.'}
                      {selectedNode === '3' && 'Gravitational acceleration pulls downward at 9.81 m/s^2. At peak height, vertical velocity momentarily stops.'}
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* TAB 4: QUIZ */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 animate-fade">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-zinc-800 text-zinc-300">
                    Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}
                  </Badge>
                  <span className="text-xs text-emerald-400 font-semibold">Score: {quizScore}</span>
                </div>

                <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-100 leading-relaxed">
                    {QUIZ_QUESTIONS[quizIndex].question}
                  </h4>

                  <div className="space-y-2">
                    {QUIZ_QUESTIONS[quizIndex].options.map((opt, idx) => {
                      const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].correct;
                      const isSelected = selectedOption === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (selectedOption === null) {
                              setSelectedOption(idx);
                              if (isCorrect) setQuizScore(quizScore + 1);
                            }
                          }}
                          className={`flex items-center justify-between rounded-lg border p-3 text-xs font-medium cursor-pointer transition-all ${
                            selectedOption === null
                              ? 'border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700'
                              : isSelected
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                                : 'border-rose-500 bg-rose-950/60 text-rose-200'
                              : isCorrect
                              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-500 opacity-60'
                          }`}
                        >
                          <span>{opt}</span>
                          {selectedOption !== null && isSelected && (
                            isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 space-y-1 text-xs">
                      <p className="font-bold text-emerald-400">Explanation</p>
                      <p className="text-zinc-300 leading-relaxed">{QUIZ_QUESTIONS[quizIndex].explanation}</p>
                    </div>
                  )}
                </Card>

                {selectedOption !== null && quizIndex < QUIZ_QUESTIONS.length - 1 && (
                  <Button
                    onClick={() => { setQuizIndex(quizIndex + 1); setSelectedOption(null); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                  >
                    Next Question <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}

            {/* TAB 5: FORMULAS */}
            {activeTab === 'formulas' && (
              <div className="space-y-4 animate-fade">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    value={formulaSearch}
                    onChange={(e) => setFormulaSearch(e.target.value)}
                    placeholder="Search equations by formula or topic..."
                    className="pl-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-3">
                  {filteredFormulas.map((f, i) => (
                    <Card key={i} className="border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200">{f.label}</span>
                        <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-[10px]">
                          {f.topic}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                        <Formula tex={f.tex} />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyFormula(f.tex)}
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
                        >
                          {copiedFormula === f.tex ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: NOTES EDITOR */}
            {activeTab === 'notes' && (
              <div className="space-y-3 animate-fade">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Interactive Markdown Note Editor
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    className="h-7 border-zinc-800 bg-zinc-900 text-xs text-emerald-400 hover:bg-zinc-800"
                  >
                    Save Notes
                  </Button>
                </div>

                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={14}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs font-mono leading-relaxed text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* TAB 7: AI CHAT Q&A */}
            {activeTab === 'chat' && (
              <div className="space-y-4 animate-fade">
                <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-3 min-h-[300px]">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>

          {/* Sticky Bottom Chat Input Bar */}
          <div className="border-t border-zinc-800 bg-zinc-900/90 p-3 shrink-0">
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI Tutor any question about this lesson..."
                className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500"
              />

              <Button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0"
              >
                <span>Ask AI</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}
