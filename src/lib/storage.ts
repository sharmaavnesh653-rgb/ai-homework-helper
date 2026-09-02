/**
 * Browser-local persistence for saved notes and study history.
 *
 * localStorage keeps this real and working with no backend: notes survive
 * reloads and restarts on that device. Swap these six functions for fetches
 * when a server-side store exists — nothing else needs to change.
 */

import type { HistoryEntry, SavedNote } from './types';

const NOTES_KEY = 'stepwise.notes.v1';
const HISTORY_KEY = 'stepwise.history.v1';
const THEME_KEY = 'stepwise.theme.v1';
const HISTORY_CAP = 100;

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    // Corrupt or quota-blocked storage shouldn't break the page.
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function makeId(): string {
  // crypto.randomUUID needs a secure context; fall back for plain http dev.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------- notes ------------------------------- */

export function getNotes(): SavedNote[] {
  return read<SavedNote[]>(NOTES_KEY, []).sort((a, b) => b.at - a.at);
}

export function saveNote(note: Omit<SavedNote, 'id' | 'at'>): SavedNote {
  const entry: SavedNote = { ...note, id: makeId(), at: Date.now() };
  write(NOTES_KEY, [entry, ...getNotes()]);
  return entry;
}

export function deleteNote(id: string): void {
  write(
    NOTES_KEY,
    getNotes().filter((n) => n.id !== id),
  );
}

/* ------------------------------ history ------------------------------ */

export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(HISTORY_KEY, []).sort((a, b) => b.at - a.at);
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'at'>): void {
  const next: HistoryEntry = { ...entry, id: makeId(), at: Date.now() };
  write(HISTORY_KEY, [next, ...getHistory()].slice(0, HISTORY_CAP));
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

/* ------------------------------- theme ------------------------------- */

export type Theme = 'light' | 'dark';

export function getTheme(): Theme | null {
  if (typeof localStorage === 'undefined') return null;
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export { THEME_KEY };
