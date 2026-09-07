import { useState, useEffect } from 'react';
import { setTheme, getTheme, type Theme } from '../../lib/storage';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial =
      getTheme() ||
      (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setLocal(initial);
  }, []);

  const flip = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';

    // Use View Transitions API if supported for ultra-smooth morph animation
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        setLocal(next);
        setTheme(next);
      });
    } else {
      setLocal(next);
      setTheme(next);
    }
  };

  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900" />
    );
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-all duration-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 shadow-sm"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
