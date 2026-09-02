import { useEffect, useMemo, useRef, useState } from 'react';

export interface Option {
  value: string;
  label: string;
  hint?: string;
  /** CSS colour for the leading dot. */
  dot?: string;
  glyph?: string;
}

interface Props {
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Show a text field once the list is long enough to need it. */
  searchable?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  clearable?: boolean;
}

/**
 * Accessible listbox with type-to-filter. Keyboard: ↑/↓ to move, Enter to pick,
 * Esc to close. Closes on outside click and restores focus to the trigger.
 */
export default function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable = true,
  disabled = false,
  disabledHint,
  clearable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open && searchable) input.current?.focus();
    if (!open) {
      setQuery('');
      setActive(0);
    }
  }, [open, searchable]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[active];
      if (pick) commit(pick.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
  };

  return (
    <div className="relative" ref={wrap}>
      <label className="mb-1.5 block text-overline text-ink-3 uppercase">{label}</label>

      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={disabled ? disabledHint : undefined}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm transition-all hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-3"
      >
        {selected?.dot && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: selected.dot }}
            aria-hidden="true"
          />
        )}
        {selected?.glyph && !selected.dot && (
          <span aria-hidden="true" className="shrink-0 text-ink-2">
            {selected.glyph}
          </span>
        )}
        <span className={`flex-1 truncate ${selected ? 'text-ink' : 'text-ink-3'}`}>
          {selected ? selected.label : disabled && disabledHint ? disabledHint : placeholder}
        </span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label={`Clear ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="shrink-0 rounded px-1 text-ink-3 transition-colors hover:text-ink"
          >
            ×
          </span>
        )}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open && (
        <div className="animate-fade absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-line bg-raised shadow-e3">
          {searchable && options.length > 6 && (
            <div className="border-b border-line p-2">
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full rounded-md bg-sunken px-2.5 py-1.5 text-sm outline-none placeholder:text-ink-3"
                aria-label={`Search ${label}`}
              />
            </div>
          )}

          <ul
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className="scroll-slim max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-ink-3">
                Nothing matches “{query}”
              </li>
            )}
            {filtered.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={isSel}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(o.value)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      i === active ? 'bg-brand-soft' : ''
                    } ${isSel ? 'font-medium text-brand' : 'text-ink'}`}
                  >
                    {o.dot && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: o.dot }}
                        aria-hidden="true"
                      />
                    )}
                    {o.glyph && !o.dot && (
                      <span aria-hidden="true" className="shrink-0">
                        {o.glyph}
                      </span>
                    )}
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="shrink-0 text-xs text-ink-3">{o.hint}</span>}
                    {isSel && (
                      <span aria-hidden="true" className="shrink-0 text-brand">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
