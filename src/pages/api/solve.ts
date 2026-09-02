import type { APIRoute } from 'astro';
import {
  buildUserContent,
  fail,
  friendlyError,
  generateStructured,
  hasKey,
  json,
  MISSING_KEY_MESSAGE,
  StudentFacingError,
} from '../../lib/server/claude';
import {
  parseAttachments,
  readJson,
  requireText,
  optionalText,
  ValidationError,
} from '../../lib/server/validate';
import { ANSWER_SCHEMA, buildSolvePrompt } from '../../lib/prompts';
import { DEFAULT_MODE, isDepth, isModeId, type TutorAnswer } from '../../lib/types';

export const prerender = false;

/**
 * Primary solve endpoint. Returns a structured answer so the UI can render
 * separated steps, formulas, concepts and a visual rather than a text blob.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);

  let question: string;
  let attachments;
  let mode = DEFAULT_MODE;
  let depth: 'normal' | 'simpler' | 'detailed' = 'normal';
  let subject: string | null = null;
  let grade: string | null = null;

  try {
    const body = await readJson(request);
    attachments = parseAttachments(body.attachments);

    // With an attachment the text can be empty — the image *is* the question.
    question =
      attachments.length > 0
        ? (optionalText(body.question, 6000) ??
          'Please read the attached work and help me with it.')
        : requireText(body.question, 'question', {
            emptyMessage: 'Type a question or attach a photo of the problem.',
          });

    if (isModeId(body.mode)) mode = body.mode;
    if (isDepth(body.depth)) depth = body.depth;
    subject = optionalText(body.subject, 60);
    grade = optionalText(body.grade, 60);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, error.status);
    return fail('Could not read that request.', 400);
  }

  try {
    const answer = await generateStructured<TutorAnswer>({
      system: buildSolvePrompt(mode, depth, subject, grade),
      content: buildUserContent(question, attachments),
      schema: ANSWER_SCHEMA,
      effort: depth === 'detailed' ? 'high' : 'medium',
    });

    // Belt-and-braces: hint mode must never carry a final answer, even if the
    // model ignores the instruction.
    if (mode === 'hint' || mode === 'check') {
      answer.finalAnswer = null;
      if (mode === 'hint') answer.workedExample = null;
    }

    return json({ answer, mode, depth });
  } catch (error) {
    if (error instanceof StudentFacingError) return fail(error.message, 502);
    console.error('[api/solve]', error);
    return fail(friendlyError(error), 502);
  }
};
