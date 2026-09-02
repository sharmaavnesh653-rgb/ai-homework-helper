import { useState } from 'react';
import { setTheme, type Theme } from '../../lib/storage';

/**
 * Light/dark toggle. The `dark` class is applied by an inline script in the
 * document head before first paint, so we read the resolved theme off the
 * element rather than re-deriving it — that way the correct icon is drawn on
 * the very first client render with no flash or empty state.
 */
export default function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
  );

  const flip = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setLocal(next);
    setTheme(next);
  };

  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-2 transition-all duration-150 hover:border-line-strong hover:text-ink"
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="12"
              y1="2.5"
              x2="12"
              y2="5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
