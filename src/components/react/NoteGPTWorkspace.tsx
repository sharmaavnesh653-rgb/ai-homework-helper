import { useState, useRef } from 'react';
import Formula from './Formula';
import VisualBlock from './VisualBlock';
import ThemeToggle from './ThemeToggle';
import type { Visual } from '../../lib/types';

interface Timestamp {
  time: string;
  seconds: number;
  label: string;
  snippet: string;
}

const SAMPLE_TIMESTAMPS: Timestamp[] = [
  { time: '00:45', seconds: 45, label: 'Problem Introduction & Setup', snippet: 'Initial parameters and vector decomposition' },
  { time: '02:15', seconds: 135, label: 'Kinematic Equations Choice', snippet: 'Selecting v_y = v_0 * sin(theta) for vertical height' },
  { time: '05:30', seconds: 330, label: 'Step-by-Step Derivation', snippet: 'Substituting values into h_max = (v_0^2 * sin^2(theta)) / (2g)' },
  { time: '08:10', seconds: 490, label: 'Self-Check & Summary', snippet: 'Verifying dimensional consistency and physical limits' },
];

const SAMPLE_MINDMAP: Visual = {
  kind: 'concept-map',
  caption: 'Projectile Motion Concept Map',
  nodes: [
    { id: '1', label: 'Kinematics' },
    { id: '2', label: 'Horizontal Motion (v_x = const)' },
    { id: '3', label: 'Vertical Motion (a_y = -g)' },
    { id: '4', label: 'Launch Angle (θ)' },
    { id: '5', label: 'Max Height (h_max)' },
    { id: '6', label: 'Flight Time (t_total)' },
  ],
  links: [
    { from: '1', to: '2', label: 'No acceleration' },
    { from: '1', to: '3', label: 'Gravity acts' },
    { from: '3', to: '4', label: 'Resolves v_y' },
    { from: '3', to: '5', label: 'Peak condition v_y=0' },
    { from: '3', to: '6', label: 'Total air time' },
  ],
};

export default function NoteGPTWorkspace() {
  // Navigation & Workspace states
  const [activeCenterTab, setActiveCenterTab] = useState<'summarizer' | 'pdf' | 'flashcards' | 'mindmap' | 'solver'>('summarizer');
  const [leftTab, setLeftTab] = useState<'media' | 'transcript' | 'file'>('media');
  const [rightTab, setRightTab] = useState<'summary' | 'takeaways' | 'mindmap' | 'notes' | 'chat'>('summary');
  const [mobileTab, setMobileTab] = useState<'source' | 'workspace'>('workspace');

  // Interactive states
  const [videoTimestamp, setVideoTimestamp] = useState(45);
  const [customNotes, setCustomNotes] = useState(
    '# Class Notes - Physics Kinematics\n- Remember: Horizontal velocity component v_x remains constant when air resistance is neglected.\n- Vertical velocity at peak height is exactly 0 m/s.\n- Key Formula: h_max = (v_y^2) / (2g)'
  );
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; time: string }>>([
    { role: 'ai', text: 'Hello! I have summarized this video on Projectile Motion & Kinematics. What would you like to explore or check?', time: '10:42 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handlers
  const handleTimestampClick = (seconds: number) => {
    setVideoTimestamp(seconds);
    // Switch to media tab if on source view
    setLeftTab('media');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setChatInput('');

    // Simulated AI Response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Great question about "${userMsg.slice(0, 30)}..."! In projectile motion, we decompose the initial velocity vector v into v_x = v*cos(θ) and v_y = v*sin(θ). Notice how gravity only affects the vertical component.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  const handleExport = (format: string) => {
    setExportNotice(`Exported notes as ${format.toUpperCase()} successfully!`);
    setTimeout(() => setExportNotice(null), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-ink font-sans selection:bg-brand/20">
      
      {/* ========================================================================= */}
      {/* 2. TOP HEADER (Navbar - Height: ~64px)                                    */}
      {/* ========================================================================= */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-line bg-surface/90 px-4 sm:px-6 backdrop-blur-md z-30">
        
        {/* Left: Brand + Project Title Dropdown */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand font-bold text-white shadow-e2">
              N
            </span>
            <span className="text-base font-extrabold tracking-tight text-ink hidden sm:inline-block">
              Note<span className="text-brand">GPT</span> <span className="text-xs font-normal text-ink-3">Studio</span>
            </span>
          </a>

          <div className="h-4 w-px bg-line hidden sm:block" />

          {/* Project Title Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas/80 px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand/40">
            <span className="h-2 w-2 rounded-full bg-ok" />
            <span className="max-w-[140px] truncate sm:max-w-[200px]">Physics 101: Kinematics</span>
            <span className="text-ink-3">▼</span>
          </div>
        </div>

        {/* Center: Quick Tab Switchers (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl border border-line bg-sunken/60 p-1">
          {[
            { id: 'summarizer', label: '✨ AI Summarizer' },
            { id: 'pdf', label: '📄 PDF Reader' },
            { id: 'flashcards', label: '🎴 Flashcards' },
            { id: 'mindmap', label: '🧠 Mindmap' },
            { id: 'solver', label: '✎ Homework Solver' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCenterTab(tab.id as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeCenterTab === tab.id
                  ? 'bg-surface text-brand shadow-e1'
                  : 'text-ink-2 hover:text-ink hover:bg-surface/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Actions, Dark Mode, Profile */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown Button */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:border-brand/40 hover:shadow-e1"
            >
              <span>📥 Export</span>
              <span className="text-ink-3">▼</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-36 rounded-xl border border-line bg-surface p-1 shadow-e3 z-50">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-ink hover:bg-sunken"
              >
                Export as PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport('markdown')}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-ink hover:bg-sunken"
              >
                Export Markdown
              </button>
              <button
                type="button"
                onClick={() => handleExport('txt')}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-ink hover:bg-sunken"
              >
                Plain Text (.txt)
              </button>
            </div>
          </div>

          <ThemeToggle />

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand font-bold text-xs border border-brand/30">
              ST
            </div>
          </div>
        </div>
      </header>

      {/* Export notification Toast */}
      {exportNotice && (
        <div className="absolute top-20 right-6 z-50 animate-fade rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-canvas shadow-e4">
          {exportNotice}
        </div>
      )}

      {/* Mobile Top View Switcher Bar */}
      <div className="flex border-b border-line bg-surface px-3 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('source')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
            mobileTab === 'source' ? 'bg-brand text-white shadow-e1' : 'text-ink-2 hover:text-ink'
          }`}
        >
          📹 Source & Video View
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('workspace')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
            mobileTab === 'workspace' ? 'bg-brand text-white shadow-e1' : 'text-ink-2 hover:text-ink'
          }`}
        >
          ⚡ AI Notes & Chat
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN SPLIT-SCREEN DASHBOARD BODY (Fixed 100vh)                         */}
      {/* ========================================================================= */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* ----------------------------------------------------------------------- */}
        {/* 3. LEFT PANEL: SOURCE WORKSPACE (45% Width Desktop)                     */}
        {/* ----------------------------------------------------------------------- */}
        <section
          className={`flex flex-col border-r border-line bg-surface/50 w-full lg:w-[45%] xl:w-[42%] shrink-0 overflow-hidden ${
            mobileTab === 'workspace' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header Tab Bar Inside Left Panel */}
          <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
            <div className="flex gap-1 rounded-lg bg-sunken p-0.5">
              {[
                { id: 'media', label: '📹 Media Player' },
                { id: 'transcript', label: '📝 Transcript' },
                { id: 'file', label: '📁 Uploaded File' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftTab(tab.id as any)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    leftTab === tab.id
                      ? 'bg-surface text-ink shadow-e1'
                      : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-ink-3">HD 1080p</span>
          </div>

          {/* Left Panel Main View Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-slim">
            
            {leftTab === 'media' && (
              <div className="space-y-4">
                {/* YouTube Video Player Embed Wrapper */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-ink shadow-e3">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/gT8E6Mmsv4U?start=${videoTimestamp}&autoplay=0`}
                    title="Physics Kinematics Lecture"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Video Info Badge */}
                <div className="rounded-xl border border-line bg-surface p-3.5 space-y-1.5 shadow-sm">
                  <h3 className="text-sm font-bold text-ink">MIT 8.01 Physics - Lecture 2: Kinematics & Vectors</h3>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    Instructor: Prof. Walter Lewin · Duration: 45:20 · Source: YouTube
                  </p>
                </div>
              </div>
            )}

            {leftTab === 'transcript' && (
              <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-3 border-b border-line pb-2">
                  <span>Timestamped Transcript</span>
                  <span>Search 🔍</span>
                </div>
                <div className="space-y-3.5 text-xs leading-relaxed">
                  {SAMPLE_TIMESTAMPS.map((t) => (
                    <div
                      key={t.time}
                      onClick={() => handleTimestampClick(t.seconds)}
                      className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-sunken cursor-pointer"
                    >
                      <span className="shrink-0 rounded bg-brand-soft px-2 py-0.5 font-mono text-brand font-semibold group-hover:bg-brand group-hover:text-white transition-colors">
                        {t.time}
                      </span>
                      <div>
                        <h5 className="font-semibold text-ink">{t.label}</h5>
                        <p className="text-ink-2 mt-0.5">{t.snippet}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'file' && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line p-8 text-center bg-surface">
                <span className="text-4xl mb-2">📄</span>
                <h4 className="text-sm font-semibold text-ink">Upload Lecture PDF / Audio</h4>
                <p className="text-xs text-ink-3 mt-1 max-w-xs">
                  Drag and drop your PDF worksheet, textbook chapter, or MP3 recording here
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-e2 hover:bg-brand-hover transition-colors"
                >
                  Choose File
                </button>
              </div>
            )}
          </div>

          {/* Left Panel Bottom Controls: Interactive Timestamps */}
          <div className="border-t border-line bg-surface p-3 space-y-2 shrink-0">
            <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider block">
              Jump to Timestamp
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TIMESTAMPS.map((t) => (
                <button
                  key={t.time}
                  type="button"
                  onClick={() => handleTimestampClick(t.seconds)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    videoTimestamp === t.seconds
                      ? 'border-brand bg-brand text-white shadow-e1'
                      : 'border-line bg-canvas text-ink-2 hover:border-brand/40 hover:text-brand'
                  }`}
                >
                  <span className="font-mono">{t.time}</span>
                  <span className="max-w-[90px] truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* 4. RIGHT PANEL: AI OUTPUT & WORKSPACE (The Core NoteGPT UI)             */}
        {/* ----------------------------------------------------------------------- */}
        <section
          className={`flex flex-col flex-1 bg-canvas overflow-hidden ${
            mobileTab === 'source' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Top Internal Header: Action Tabs + Glassmorphic Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-line bg-surface px-4 py-2 gap-2 shrink-0 z-10">
            
            {/* Right Panel Main Tabs */}
            <div className="flex gap-1 overflow-x-auto scroll-slim">
              {[
                { id: 'summary', label: '✨ AI Summary' },
                { id: 'takeaways', label: '💡 Key Takeaways' },
                { id: 'mindmap', label: '🧠 Mindmap Diagram' },
                { id: 'notes', label: '📝 Interactive Notes' },
                { id: 'chat', label: '💬 AI Q&A Chat' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    rightTab === tab.id
                      ? 'bg-brand text-white shadow-e1'
                      : 'text-ink-2 hover:text-ink hover:bg-sunken'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink transition-colors"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink transition-colors"
              >
                ✨ AI Rewrite
              </button>
              <button
                type="button"
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-line-strong hover:text-ink transition-colors"
              >
                Polish
              </button>
            </div>
          </div>

          {/* Main Workspace Body (Independently Scrollable inside 100vh) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-slim">
            
            {/* TAB 1: AI SUMMARY */}
            {rightTab === 'summary' && (
              <div className="space-y-6 animate-fade">
                {/* Executive Overview */}
                <div className="rounded-xl border border-line bg-surface p-5 shadow-e1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-overline text-brand uppercase font-bold">Executive Summary</span>
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                      AI Generated · 98% Accuracy
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink font-medium">
                    This lecture covers the fundamental principles of two-dimensional kinematics, specifically projectile motion under gravitational acceleration. It derives equation formulas for maximum height, range, and time of flight while emphasizing component separation.
                  </p>
                </div>

                {/* Structured Breakdown Cards with Interactive Timestamps */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Step-by-Step Breakdown</h4>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-semibold text-ink">1. Vector Velocity Decomposition</h5>
                        <button
                          type="button"
                          onClick={() => handleTimestampClick(45)}
                          className="rounded bg-brand-soft px-2 py-0.5 text-xs font-mono font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
                        >
                          ▶ 00:45
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-ink-2">
                        Any 2D motion can be decoupled into orthogonal horizontal (X) and vertical (Y) axes. Since gravity acts strictly vertically, vertical acceleration is -g while horizontal acceleration is zero.
                      </p>
                      <div className="rounded-lg bg-sunken p-2.5">
                        <Formula tex="v_x = v_0 \cos\theta, \quad v_y = v_0 \sin\theta - g t" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-semibold text-ink">2. Maximum Peak Height Calculation</h5>
                        <button
                          type="button"
                          onClick={() => handleTimestampClick(330)}
                          className="rounded bg-brand-soft px-2 py-0.5 text-xs font-mono font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
                        >
                          ▶ 05:30
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-ink-2">
                        At the apex of the projectile trajectory, vertical velocity momentarily reaches zero ($v_y = 0$). Solving the kinematic equation yields:
                      </p>
                      <div className="rounded-lg bg-sunken p-2.5">
                        <Formula tex="h_{\text{max}} = \frac{v_0^2 \sin^2\theta}{2g}" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KEY TAKEAWAYS */}
            {rightTab === 'takeaways' && (
              <div className="space-y-4 animate-fade">
                <div className="rounded-xl border border-line bg-surface p-5 shadow-e1 space-y-3">
                  <h4 className="text-sm font-bold text-ink">Core Takeaways to Remember</h4>
                  <ul className="space-y-2.5 text-xs text-ink-2">
                    <li className="flex gap-2">
                      <span className="text-brand font-bold">✓</span>
                      <span>Horizontal velocity ($v_x$) never changes throughout the trajectory when neglecting drag.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand font-bold">✓</span>
                      <span>Maximum range is achieved at a launch angle of $\theta = 45^\circ$.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand font-bold">✓</span>
                      <span>Time to reach max height equals time to descend back to launch elevation.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: MINDMAP DIAGRAM */}
            {rightTab === 'mindmap' && (
              <div className="space-y-4 animate-fade">
                <div className="rounded-xl border border-line bg-surface p-4 shadow-e1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-ink">Interactive Concept Map</h4>
                    <span className="text-xs text-ink-3">Click nodes to expand</span>
                  </div>
                  <VisualBlock visual={SAMPLE_MINDMAP} />
                </div>
              </div>
            )}

            {/* TAB 4: INTERACTIVE NOTES EDITOR */}
            {rightTab === 'notes' && (
              <div className="space-y-3 animate-fade">
                <div className="flex items-center justify-between">
                  <label htmlFor="custom-notes" className="text-xs font-bold text-ink-3 uppercase">
                    Your Custom Notes (Markdown Supported)
                  </label>
                  <span className="text-xs text-ok font-medium">Auto-saved to browser</span>
                </div>
                <textarea
                  id="custom-notes"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={12}
                  className="w-full rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed font-mono text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring shadow-inner"
                />
              </div>
            )}

            {/* TAB 5: AI Q&A CHAT */}
            {rightTab === 'chat' && (
              <div className="space-y-4 animate-fade">
                <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3 min-h-[300px]">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-brand text-white rounded-br-none shadow-e1'
                            : 'bg-sunken border border-line text-ink rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-ink-3 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sticky Area: "Ask AI about this video/document" Chat Prompt */}
          <div className="border-t border-line bg-surface p-3.5 shrink-0 z-20">
            <form onSubmit={handleSendChat} className="flex gap-2 items-center">
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-canvas text-ink-2 hover:bg-sunken hover:text-ink transition-colors"
                title="Attach file or screenshot"
              >
                📎
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI about this video, formula, or timestamp..."
                className="flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring placeholder:text-ink-3 shadow-inner"
              />

              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-e2 hover:bg-brand-hover active:translate-y-px disabled:opacity-40 transition-all shrink-0"
              >
                <span>Ask AI</span>
                <span>→</span>
              </button>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}
