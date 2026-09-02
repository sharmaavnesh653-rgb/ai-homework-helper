import { useEffect, useState } from 'react';
import { EmptyState } from './States';
import { clearHistory, deleteNote, getHistory, getNotes } from '../../lib/storage';
import { subjectById } from '../../lib/curriculum';
import { MODES, type HistoryEntry, type SavedNote } from '../../lib/types';

function when(at: number): string {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(at).toLocaleDateString();
}

function SubjectTag({ subject }: { subject?: string | null }) {
  const s = subjectById(subject);
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-ink-2"
      style={{ borderColor: `var(--color-${s.hue})` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: `var(--color-${s.hue})` }}
        aria-hidden="true"
      />
      {s.name}
    </span>
  );
}

export function SavedNotesList() {
  const [notes, setNotes] = useState<SavedNote[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // Read after mount: localStorage isn't available during SSR.
  useEffect(() => setNotes(getNotes()), []);

  if (notes === null) return null;

  if (notes.length === 0) {
    return (
      <EmptyState
        glyph="🔖"
        title="No saved work yet"
        body="Use “Save to notes” on any walkthrough, or save a whole chapter from Study Notes, and it will appear here."
      >
        <a
          href="/solve"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Solve something first
        </a>
      </EmptyState>
    );
  }

  const remove = (id: string) => {
    deleteNote(id);
    setNotes(getNotes());
  };

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const isOpen = open === note.id;
        return (
          <li
            key={note.id}
            className="animate-fade overflow-hidden rounded-xl border border-line bg-surface shadow-e1"
          >
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-[15px] leading-snug font-semibold text-ink">
                  {note.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                  <SubjectTag subject={note.subject} />
                  {note.chapter && <span>{note.chapter}</span>}
                  {note.grade && <span>· {note.grade}</span>}
                  <span>· {when(note.at)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : note.id)}
                  aria-expanded={isOpen}
                  className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  {isOpen ? 'Hide' : 'Open'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(note.id)}
                  aria-label={`Delete ${note.title}`}
                  className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-3 transition-colors hover:border-danger/40 hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </div>

            {isOpen && (
              <pre className="animate-fade scroll-slim max-h-96 overflow-auto border-t border-line bg-sunken px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-2 sm:px-5">
                {note.body}
              </pre>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function HistoryList() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => setEntries(getHistory()), []);

  if (entries === null) return null;

  if (entries.length === 0) {
    return (
      <EmptyState
        glyph="🕘"
        title="No study history yet"
        body="Every question you ask gets logged here so you can pick up where you left off."
      >
        <a
          href="/solve"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Ask your first question
        </a>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-2">
          {entries.length} question{entries.length === 1 ? '' : 's'}, most recent first
        </p>
        <button
          type="button"
          onClick={() => {
            clearHistory();
            setEntries([]);
          }}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-3 transition-colors hover:border-danger/40 hover:text-danger"
        >
          Clear history
        </button>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="line-clamp-2 text-sm leading-relaxed text-ink">{e.question}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                <SubjectTag subject={e.subject} />
                <span className="rounded bg-sunken px-1.5 py-0.5">
                  {MODES.find((m) => m.id === e.mode)?.short ?? e.mode}
                </span>
                <span>· {when(e.at)}</span>
              </div>
            </div>
            <a
              href={`/solve?q=${encodeURIComponent(e.question)}`}
              className="shrink-0 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand"
            >
              Ask again
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
