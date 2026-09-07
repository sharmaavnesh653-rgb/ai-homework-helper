import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import CommandPalette from './CommandPalette';
import {
  Home,
  Sparkles,
  BookOpen,
  Compass,
  HelpCircle,
  Layers,
  Sliders,
  Bookmark,
  Clock,
  Menu,
  X,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: any;
    desc: string;
  }[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    group: 'HOME',
    items: [
      { label: 'Home', href: '/', icon: Home, desc: 'Overview & Quick Solver' },
      { label: 'Homework Solver', href: '/solve', icon: Sparkles, desc: 'Step-by-step AI tutor' },
    ],
  },
  {
    group: 'STUDY',
    items: [
      { label: 'Study Notes', href: '/notes', icon: BookOpen, desc: 'Textbook chapter summaries' },
      { label: 'Subjects', href: '/subjects', icon: Compass, desc: 'Subject curriculum directory' },
      { label: 'Practice', href: '/practice', icon: HelpCircle, desc: 'Misconception quizzes' },
      { label: 'Flashcards', href: '/flashcards', icon: Layers, desc: 'Active recall decks' },
      { label: 'Diagrams', href: '/diagrams', icon: Sliders, desc: 'Visual mindmaps & flows' },
    ],
  },
  {
    group: 'LIBRARY',
    items: [
      { label: 'Saved Work', href: '/saved', icon: Bookmark, desc: 'Saved notes & solutions' },
      { label: 'History', href: '/history', icon: Clock, desc: 'Past homework sessions' },
    ],
  },
];

export default function AppSidebar({ pathname = '/' }: { pathname?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Close mobile drawer on route change or ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible lg and up) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-950/90 text-zinc-100 shrink-0 h-screen sticky top-0 z-30 select-none backdrop-blur-xl">
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-zinc-800/80">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-100 flex items-center gap-1">
                Stepwise <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">AI</span>
              </span>
              <span className="text-[11px] text-zinc-500">Student AI Workspace</span>
            </div>
          </a>
        </div>

        {/* Search Bar / Command Palette Trigger */}
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <CommandPalette />
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scroll-slim">
          {NAVIGATION_GROUPS.map((sec) => (
            <div key={sec.group} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                {sec.group}
              </h3>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      title={item.desc}
                      className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-bold'
                          : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs text-zinc-500 font-mono">Theme</span>
          </div>

          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
          >
            <span>Studio</span>
            <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </aside>

      {/* MOBILE TOP BAR (Visible on screens < lg) */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md">
        <a href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 font-extrabold text-white text-xs">
            S
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">
            Stepwise
          </span>
        </a>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-4/5 max-w-xs flex-col bg-zinc-950 border-r border-zinc-800 p-5 z-10 animate-slide-in space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white font-extrabold">
                  S
                </div>
                <span className="text-sm font-bold text-zinc-100">Stepwise AI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-6 scroll-slim">
              {NAVIGATION_GROUPS.map((sec) => (
                <div key={sec.group} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    {sec.group}
                  </h4>
                  <div className="space-y-1">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                            active
                              ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-bold'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg px-2">
        {[
          { label: 'Home', href: '/', icon: Home },
          { label: 'Solver', href: '/solve', icon: Sparkles },
          { label: 'Notes', href: '/notes', icon: BookOpen },
          { label: 'Practice', href: '/practice', icon: HelpCircle },
          { label: 'Library', href: '/saved', icon: Bookmark },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
                active ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
