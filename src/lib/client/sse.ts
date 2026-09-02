/**
 * Client-side SSE reader shared by the follow-up chat and the notes chat.
 *
 * Frames arrive split across arbitrary byte boundaries, so we buffer until a
 * complete `\n\n`-delimited frame is available. TextDecoder with {stream:true}
 * handles multibyte characters spanning chunks.
 */

export interface SseHandlers {
  onDelta: (text: string) => void;
  onError?: (message: string) => void;
  onDone?: (stopReason: string | null) => void;
}

export async function streamChat(
  body: unknown,
  handlers: SseHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  // Failures before the stream opens come back as JSON with a real status.
  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status}).`;
    try {
      const detail = await response.json();
      if (detail?.error) message = detail.error;
    } catch {
      /* keep the status-code message */
    }
    handlers.onError?.(message);
    handlers.onDone?.('error');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      let name = 'message';
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event: ')) name = line.slice(7).trim();
        else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
      }
      if (!dataLines.length) continue;

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(dataLines.join('\n'));
      } catch {
        continue; // skip a malformed frame rather than aborting the stream
      }

      if (name === 'delta' && typeof payload.text === 'string') {
        handlers.onDelta(payload.text);
      } else if (name === 'error' && typeof payload.message === 'string') {
        handlers.onError?.(payload.message);
      } else if (name === 'done') {
        handlers.onDone?.((payload.stopReason as string) ?? null);
      }
    }
  }
}

/** POST JSON and surface a server error message as a thrown Error. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* fall through */
  }

  if (!response.ok) {
    const message =
      (parsed as { error?: string } | null)?.error ??
      `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return parsed as T;
}
