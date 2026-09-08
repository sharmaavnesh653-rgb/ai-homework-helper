import { useEffect, useState } from 'react';
import { EmptyState } from './States';
import { clearHistory, deleteNote, getHistory, getNotes } from '../../lib/storage';
import { subjectById } from '../../lib/curriculum';
import { MODES, type HistoryEntry, type SavedNote } from '../../lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Bookmark,
  Clock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen
} from 'lucide-react';

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
    <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] bg-emerald-100 dark:bg-emerald-950/30">
      {s.name}
    </Badge>
  );
}

export function SavedNotesList() {
  const [notes, setNotes] = useState<SavedNote[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

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
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Solve something first</span>
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
          <Card
            key={note.id}
            className="animate-fade overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl space-y-0"
          >
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {note.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  <SubjectTag subject={note.subject} />
                  {note.chapter && <span>{note.chapter}</span>}
                  {note.grade && <span>· {note.grade}</span>}
                  <span>· {when(note.at)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(isOpen ? null : note.id)}
                  className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-1"
                >
                  <span>{isOpen ? 'Collapse' : 'Expand'}</span>
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(note.id)}
                  className="h-8 text-xs text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isOpen && (
              <pre className="animate-fade scroll-slim max-h-96 overflow-auto border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {note.body}
              </pre>
            )}
          </Card>
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
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask your first question</span>
        </a>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {entries.length} question{entries.length === 1 ? '' : 's'} logged
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearHistory();
            setEntries([]);
          }}
          className="h-8 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-xs text-red-500 dark:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-900 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear History</span>
        </Button>
      </div>

      <Card className="divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 shadow-xl">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start justify-between gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium">{e.question}</p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                <SubjectTag subject={e.subject} />
                <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px]">
                  {MODES.find((m) => m.id === e.mode)?.short ?? e.mode}
                </Badge>
                <span>· {when(e.at)}</span>
              </div>
            </div>

            <a
              href={`/solve?question=${encodeURIComponent(e.question)}&subject=${e.subject || ''}`}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all shrink-0"
            >
              <span>Ask Again</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </Card>
    </div>
  );
}
