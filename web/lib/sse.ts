/**
 * Minimal Server-Sent Events consumer for `fetch()` responses returned by the
 * RejectCheck backend. The backend writes `data: <json>\n\n` frames; this
 * helper parses them and forwards each decoded payload to `onEvent`.
 *
 * Returns when the stream closes naturally. Throws if `response.body` is null.
 */
export async function consumeSSE<T>(
  response: Response,
  onEvent: (event: T) => void,
): Promise<void> {
  if (!response.body) throw new Error('Response has no body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = JSON.parse(line.slice(6)) as T;
      onEvent(payload);
    }
  }
}
