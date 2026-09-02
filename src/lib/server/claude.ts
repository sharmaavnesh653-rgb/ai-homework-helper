/**
 * Shared server-side Claude helpers.
 *
 * Every route needs the same three things: a client, a way to turn SDK errors
 * into a sentence a student can act on, and JSON response helpers.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from 'astro:env/server';
import { MODEL, type Attachment } from '../types';

export const MISSING_KEY_MESSAGE =
  'The server is missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.';

export function hasKey(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

export function makeClient(): Anthropic {
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function fail(message: string, status: number): Response {
  return json({ error: message }, status);
}

/** Map an SDK/transport error to something worth showing a student. */
export function friendlyError(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError) {
    return 'The tutor is busy right now. Give it a few seconds and try again.';
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return 'The server API key was rejected. Check ANTHROPIC_API_KEY.';
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return 'This API key does not have access to the model this app uses.';
  }
  if (error instanceof Anthropic.BadRequestError) {
    return 'The tutor rejected that request. If you attached a file, try a smaller one.';
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Couldn't reach the tutor service. Check your connection and retry.";
  }
  return 'Something went wrong reaching the tutor. Please try again.';
}

/** Turn a refusal / truncation stop_reason into a message, or null if fine. */
export function stopReasonMessage(stopReason: string | null): string | null {
  if (stopReason === 'refusal') {
    return "I can't help with that one. Try rephrasing it as the specific schoolwork problem you're stuck on.";
  }
  if (stopReason === 'max_tokens') {
    return 'That answer got cut off. Try asking about one part of the problem at a time.';
  }
  return null;
}

/**
 * Build user content blocks. Documents and images must precede the text block
 * so the model reads the attachment as context for the question.
 */
export function buildUserContent(
  text: string,
  attachments: Attachment[] = [],
): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const file of attachments) {
    if (file.kind === 'image') {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.mediaType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
          data: file.data,
        },
      });
    } else {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: file.data },
      });
    }
  }

  blocks.push({ type: 'text', text });
  return blocks;
}

/**
 * Pull a JSON object out of a model reply.
 *
 * `output_config.format` enforces the shape on the first-party API, but some
 * gateways and proxies silently drop the parameter and return prose or a
 * ```json fenced block instead. Rather than failing the request, strip the
 * fence and take the outermost balanced object.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // Fast path: already clean JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through to recovery */
  }

  // Strip a leading ```json / ``` fence and its closing counterpart.
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* keep going */
    }
  }

  // Last resort: scan for the outermost balanced { } , ignoring braces that
  // appear inside strings (LaTeX in these payloads is full of them).
  const start = trimmed.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new StudentFacingError(
    "The tutor's reply came back malformed. Please try again.",
  );
}

/** Names of top-level keys a schema declares as required. */
function requiredKeys(schema: Record<string, unknown>): string[] {
  const req = schema.required;
  return Array.isArray(req) ? req.filter((k): k is string => typeof k === 'string') : [];
}

/**
 * One structured-output call.
 *
 * Sends `output_config.format` (authoritative where supported) AND restates the
 * schema in the system prompt, so a gateway that ignores the parameter still
 * produces the right shape. Retries once with a blunter instruction if the first
 * reply is missing required keys.
 */
export async function generateStructured<T>(opts: {
  system: string;
  content: Anthropic.ContentBlockParam[] | string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  effort?: 'low' | 'medium' | 'high';
}): Promise<T> {
  const client = makeClient();
  const needed = requiredKeys(opts.schema);

  const shapeRule = `\n\nOUTPUT FORMAT — this is mandatory.\nReply with a single JSON object and nothing else: no prose before or after it, and no markdown code fence. It must validate against this JSON Schema:\n${JSON.stringify(opts.schema)}`;

  const attempt = async (extra: string): Promise<string> => {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: opts.effort ?? 'medium',
        format: { type: 'json_schema', schema: opts.schema },
      },
      system: opts.system + shapeRule + extra,
      messages: [{ role: 'user', content: opts.content as never }],
    });

    const refusal = stopReasonMessage(message.stop_reason);
    if (refusal) throw new StudentFacingError(refusal);

    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  };

  const looksComplete = (value: unknown): value is T =>
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    needed.every((k) => k in (value as Record<string, unknown>));

  let parsed: unknown;
  try {
    parsed = extractJson(await attempt(''));
  } catch (error) {
    if (!(error instanceof StudentFacingError)) throw error;
    parsed = null; // fall through to the retry
  }

  if (looksComplete(parsed)) return parsed;

  // Second and final try, naming the keys that were missing.
  const retry = extractJson(
    await attempt(
      `\n\nYour previous reply was not a valid JSON object with these top-level keys: ${needed.join(', ')}. Output only the JSON object this time.`,
    ),
  );

  if (!looksComplete(retry)) {
    throw new StudentFacingError(
      "The tutor's reply came back in the wrong shape. Please try again.",
    );
  }

  return retry;
}

/** An error whose message is already safe to show the student. */
export class StudentFacingError extends Error {}
