import { useEffect, useState } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  Compass,
  HelpCircle,
  Layers,
  Sliders,
  Bookmark,
  Clock,
  X
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

interface NavItem {
  title: string;
  desc: string;
  href: string;
  icon: any;
  category: 'Study Hubs' | 'Practice & Visuals' | 'Library';
}

const ITEMS: NavItem[] = [
  { title: 'Homework Helper', desc: 'Ask questions, get step-by-step reasoning & formulas', href: '/solve', icon: Sparkles, category: 'Study Hubs' },
  { title: 'Study Notes', desc: 'Structured chapter notes & anchored AI study chat', href: '/notes', icon: BookOpen, category: 'Study Hubs' },
  { title: 'Subjects Directory', desc: 'Explore 8 subjects with chapter lists and examples', href: '/subjects', icon: Compass, category: 'Study Hubs' },
  { title: 'Practice & Quizzes', desc: 'Misconception-driven quizzes and instant scoring', href: '/practice', icon: HelpCircle, category: 'Practice & Visuals' },
  { title: 'Flashcards', desc: 'Interactive flashcards connected to your learning', href: '/flashcards', icon: Layers, category: 'Practice & Visuals' },
  { title: 'Diagrams & Concept Maps', desc: 'Generate visual mindmaps, flowcharts & timelines', href: '/diagrams', icon: Sliders, category: 'Practice & Visuals' },
  { title: 'Saved Work Library', desc: 'Your saved solutions, revision notes & flashcards', href: '/saved', icon: Bookmark, category: 'Library' },
  { title: 'Question History', desc: 'Browse and revisit previous homework sessions', href: '/history', icon: Clock, category: 'Library' },
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
      {/* Trigger Button inside top bar / sidebar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-inner"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="truncate">Search workspace...</span>
        </div>
        <kbd className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
          ⌘K
        </kbd>
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-fade"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-fade"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center border-b border-zinc-800 px-4 py-3 bg-zinc-900/60 gap-2">
              <Search className="h-4 w-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, subjects, notes, history..."
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 scroll-slim">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No matching tools found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-900 group"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-900 text-emerald-400 border border-zinc-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-zinc-800">
                              {item.category}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-zinc-400">{item.desc}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-[11px] text-zinc-400 font-mono">
              <span>Press <kbd className="text-zinc-300">↵</kbd> to jump</span>
              <span>Stepwise Workspace</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
