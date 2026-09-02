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
import {
  optionalText,
  readJson,
  requireText,
  ValidationError,
} from '../../lib/server/validate';
import { PRACTICE_SCHEMA, buildPracticePrompt } from '../../lib/prompts';
import type { PracticeSet } from '../../lib/types';

export const prerender = false;

/** Generates flashcards + a multiple-choice quiz for a topic. */
export const POST: APIRoute = async ({ request }) => {
  if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);

  let topic: string;
  let subject: string;
  let grade: string | null = null;

  try {
    const body = await readJson(request);
    topic = requireText(body.topic, 'topic', {
      max: 200,
      emptyMessage: 'Pick a topic to practise.',
    });
    subject = optionalText(body.subject, 60) ?? 'general studies';
    grade = optionalText(body.grade, 60);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, error.status);
    return fail('Could not read that request.', 400);
  }

  try {
    const practice = await generateStructured<PracticeSet>({
      system: buildPracticePrompt(topic, subject, grade),
      content: `Create the practice set for "${topic}".`,
      schema: PRACTICE_SCHEMA,
      effort: 'medium',
    });

    // Guard the index so a bad value can't break quiz scoring in the UI.
    practice.quiz = practice.quiz.filter(
      (q) =>
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.answerIndex >= 0 &&
        q.answerIndex < q.options.length,
    );

    return json({ practice });
  } catch (error) {
    if (error instanceof StudentFacingError) return fail(error.message, 502);
    console.error('[api/practice]', error);
    return fail(friendlyError(error), 502);
  }
};
