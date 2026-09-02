/**
 * Shared types for the tutor pipeline. The structured answer shape is the
 * contract between the API route and the chat UI — the model is forced to fill
 * it in, so the UI can render distinct sections instead of a wall of text.
 */

import type { SubjectId } from './curriculum';

export const MODEL = 'claude-opus-5';

/** How much help the student asked for. */
export const MODES = [
  {
    id: 'guide',
    label: 'Walk me through it',
    short: 'Guide',
    blurb: 'Step-by-step reasoning I can follow along with.',
  },
  {
    id: 'hint',
    label: 'Just a hint',
    short: 'Hint',
    blurb: 'One nudge to get me unstuck — no answer.',
  },
  {
    id: 'check',
    label: 'Check my work',
    short: 'Check',
    blurb: "Find my mistake, but don't redo it for me.",
  },
] as const;

export type ModeId = (typeof MODES)[number]['id'];
export const DEFAULT_MODE: ModeId = 'guide';

export function isModeId(v: unknown): v is ModeId {
  return MODES.some((m) => m.id === v);
}

/** Depth control for the Simplify / Detailed Explanation actions. */
export type Depth = 'normal' | 'simpler' | 'detailed';
export function isDepth(v: unknown): v is Depth {
  return v === 'normal' || v === 'simpler' || v === 'detailed';
}

export const MAX_QUESTION_LENGTH = 6000;
/** 4MB per attachment keeps us well inside the 32MB request ceiling. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;
export const ACCEPTED_DOC_TYPES = ['application/pdf'] as const;

export interface Attachment {
  kind: 'image' | 'pdf';
  mediaType: string;
  /** Base64, no data: prefix. */
  data: string;
  name: string;
}

/* ------------------------------------------------------------------ *
 * Structured answer
 * ------------------------------------------------------------------ */

export interface Step {
  title: string;
  detail: string;
  /** KaTeX source, rendered as a display block. */
  formula?: string;
  /** A short aside: a warning, a common mistake, a reminder. */
  note?: string;
}

export interface Concept {
  term: string;
  meaning: string;
}

export interface TableViz {
  kind: 'table';
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface ChartViz {
  kind: 'chart';
  chartType: 'bar' | 'line' | 'scatter';
  caption?: string;
  xLabel?: string;
  yLabel?: string;
  series: { name: string; points: { x: number; y: number }[] }[];
}

export interface ConceptMapViz {
  kind: 'concept-map';
  caption?: string;
  nodes: { id: string; label: string }[];
  links: { from: string; to: string; label?: string }[];
}

/** A labelled diagram: parts pointing at a described object. */
export interface LabelledViz {
  kind: 'labelled';
  caption?: string;
  subject: string;
  parts: { label: string; describes: string }[];
}

export type Visual = TableViz | ChartViz | ConceptMapViz | LabelledViz;

export interface TutorAnswer {
  /** One line: what the question is actually asking. */
  understanding: string;
  steps: Step[];
  concepts: Concept[];
  formulaSummary?: string;
  visual?: Visual | null;
  workedExample?: { prompt: string; walkthrough: string } | null;
  /** Omitted in hint mode by design. */
  finalAnswer?: string | null;
  checkYourself: string;
  followUps: string[];
}

/* ------------------------------------------------------------------ *
 * Notes
 * ------------------------------------------------------------------ */

export interface NotesSection {
  heading: string;
  keyPoints: string[];
  definitions?: { term: string; meaning: string }[];
  formulas?: string[];
  example?: string;
}

export interface StudyNotes {
  title: string;
  overview: string;
  sections: NotesSection[];
  importantQuestions: string[];
  quickRevision: string[];
}

/* ------------------------------------------------------------------ *
 * Practice
 * ------------------------------------------------------------------ */

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into options. */
  answerIndex: number;
  explanation: string;
}

export interface PracticeSet {
  topic: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

/* ------------------------------------------------------------------ *
 * Chat + persistence
 * ------------------------------------------------------------------ */

export interface ChatTurn {
  id: string;
  role: 'student' | 'tutor';
  /** Free text for student turns and follow-up tutor replies. */
  text?: string;
  /** Present on the primary structured tutor reply. */
  answer?: TutorAnswer;
  attachments?: { name: string; kind: 'image' | 'pdf' }[];
  mode?: ModeId;
  at: number;
}

export interface SavedNote {
  id: string;
  title: string;
  body: string;
  subject?: SubjectId | null;
  grade?: string | null;
  book?: string | null;
  chapter?: string | null;
  at: number;
}

export interface HistoryEntry {
  id: string;
  question: string;
  subject?: SubjectId | null;
  mode: ModeId;
  at: number;
}
