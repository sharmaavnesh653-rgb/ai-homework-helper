import { useEffect, useState } from 'react';

interface NavItem {
  title: string;
  desc: string;
  href: string;
  icon: string;
  category: 'Study Hubs' | 'Practice & Visuals' | 'Library';
}

const ITEMS: NavItem[] = [
  { title: 'Homework Helper', desc: 'Ask questions, get step-by-step reasoning & formulas', href: '/solve', icon: '✎', category: 'Study Hubs' },
  { title: 'Study Notes', desc: 'Structured chapter notes & anchored AI study chat', href: '/notes', icon: '📓', category: 'Study Hubs' },
  { title: 'Subjects Directory', desc: 'Explore 8 subjects with chapter lists and examples', href: '/subjects', icon: '🧭', category: 'Study Hubs' },
  { title: 'Practice & Quizzes', desc: 'Misconception-driven quizzes and instant scoring', href: '/practice', icon: '🎴', category: 'Practice & Visuals' },
  { title: 'Flashcards', desc: 'Interactive flashcards connected to your learning', href: '/flashcards', icon: '🎴', category: 'Practice & Visuals' },
  { title: 'Diagrams & Concept Maps', desc: 'Generate visual mindmaps, flowcharts & timelines', href: '/diagrams', icon: '🧠', category: 'Practice & Visuals' },
  { title: 'Saved Work Library', desc: 'Your saved solutions, revision notes & flashcards', href: '/saved', icon: '💾', category: 'Library' },
  { title: 'Question History', desc: 'Browse and revisit previous homework sessions', href: '/history', icon: '🕒', category: 'Library' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Trigger Button inside top bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
      >
        <span aria-hidden="true">🔍</span>
        <span className="hidden sm:inline">Search destinations...</span>
        <kbd className="hidden sm:inline-block rounded border border-line-strong bg-sunken px-1.5 py-0.5 text-[10px] font-mono text-ink-2">
          ⌘K
        </kbd>
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/40 backdrop-blur-sm animate-fade">
          <div
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-e4 animate-rise"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center border-b border-line px-4 py-3 bg-sunken/40">
              <span className="mr-3 text-lg text-ink-3">🔍</span>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, subjects, notes, history... (Esc to close)"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-2 rounded px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-sunken hover:text-ink"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 scroll-slim">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-3">
                  No matching tools found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-soft/60 group"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sunken text-sm text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink group-hover:text-brand">
                            {item.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-ink-3">
                            {item.category}
                          </span>
                        </div>
                        <p className="truncate text-xs text-ink-2">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line bg-sunken/40 px-4 py-2 text-[11px] text-ink-3">
              <span>Press <kbd className="font-mono">↵</kbd> to select</span>
              <span>Stepwise Workspace</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
