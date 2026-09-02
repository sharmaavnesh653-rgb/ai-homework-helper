/**
 * Request validation shared by the API routes. Keeping it here means a bad
 * payload gets the same clear message whichever endpoint receives it.
 */

import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_QUESTION_LENGTH,
  type Attachment,
} from '../types';

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('Expected a JSON object.');
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Expected a JSON body.');
  }
}

export function requireText(
  value: unknown,
  field: string,
  { max = MAX_QUESTION_LENGTH, emptyMessage = `Please include a ${field}.` } = {},
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(emptyMessage);
  }
  if (value.length > max) {
    throw new ValidationError(
      `That ${field} is longer than ${max} characters. Trim it to the part you need help with.`,
      413,
    );
  }
  return value.trim();
}

export function optionalText(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** Estimate decoded byte length of a base64 payload without decoding it. */
function base64Bytes(data: string): number {
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

export function parseAttachments(value: unknown): Attachment[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError('Attachments must be an array.');
  }
  if (value.length > 4) {
    throw new ValidationError('Please attach at most 4 files.');
  }

  return value.map((raw, i) => {
    if (!raw || typeof raw !== 'object') {
      throw new ValidationError(`Attachment ${i + 1} is malformed.`);
    }
    const { mediaType, data, name } = raw as Record<string, unknown>;

    if (typeof mediaType !== 'string' || typeof data !== 'string' || !data) {
      throw new ValidationError(`Attachment ${i + 1} is missing its type or data.`);
    }

    const isImage = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mediaType);
    const isDoc = (ACCEPTED_DOC_TYPES as readonly string[]).includes(mediaType);
    if (!isImage && !isDoc) {
      throw new ValidationError(
        `"${mediaType}" isn't supported. Attach a PNG, JPEG, WebP, GIF or PDF.`,
      );
    }

    if (base64Bytes(data) > MAX_FILE_BYTES) {
      throw new ValidationError(
        `"${typeof name === 'string' ? name : 'That file'}" is over 4MB. Please attach a smaller one.`,
        413,
      );
    }

    return {
      kind: isImage ? 'image' : 'pdf',
      mediaType,
      data,
      name: typeof name === 'string' && name ? name.slice(0, 120) : `attachment-${i + 1}`,
    };
  });
}

/** Conversation history for follow-up turns. */
export function parseHistory(
  value: unknown,
): { role: 'user' | 'assistant'; content: string }[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (t): t is { role: string; content: string } =>
        Boolean(t) &&
        typeof t === 'object' &&
        typeof (t as Record<string, unknown>).content === 'string' &&
        ((t as Record<string, unknown>).role === 'user' ||
          (t as Record<string, unknown>).role === 'assistant'),
    )
    .slice(-20)
    .map((t) => ({
      role: t.role as 'user' | 'assistant',
      content: t.content.slice(0, 8000),
    }));
}
