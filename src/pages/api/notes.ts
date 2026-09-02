import type { APIRoute } from 'astro';
import {
  fail,
  friendlyError,
  generateStructured,
  hasKey,
  json,
  MISSING_KEY_MESSAGE,
  StudentFacingError,
} from '../../lib/server/claude';
import { readJson, requireText, ValidationError } from '../../lib/server/validate';
import { NOTES_SCHEMA, buildNotesPrompt } from '../../lib/prompts';
import type { StudyNotes } from '../../lib/types';

export const prerender = false;

/** Generates structured revision notes for one chapter of one book. */
export const POST: APIRoute = async ({ request }) => {
  if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);

  let grade: string, subject: string, book: string, chapter: string;

  try {
    const body = await readJson(request);
    grade = requireText(body.grade, 'grade', {
      max: 60,
      emptyMessage: 'Choose your class or grade first.',
    });
    subject = requireText(body.subject, 'subject', {
      max: 60,
      emptyMessage: 'Choose a subject first.',
    });
    book = requireText(body.book, 'book', {
      max: 160,
      emptyMessage: 'Choose a textbook first.',
    });
    chapter = requireText(body.chapter, 'chapter', {
      max: 200,
      emptyMessage: 'Choose a chapter first.',
    });
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, error.status);
    return fail('Could not read that request.', 400);
  }

  try {
    const notes = await generateStructured<StudyNotes>({
      system: buildNotesPrompt(grade, subject, book, chapter),
      content: `Write the revision notes for "${chapter}".`,
      schema: NOTES_SCHEMA,
      effort: 'medium',
    });
    return json({ notes });
  } catch (error) {
    if (error instanceof StudentFacingError) return fail(error.message, 502);
    console.error('[api/notes]', error);
    return fail(friendlyError(error), 502);
  }
};
