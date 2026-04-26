import type { APIResponse } from '@playwright/test';

export type SseEvent = { step: string; [k: string]: unknown };

/**
 * Reads an SSE response body and returns the parsed events.
 * Stops after `maxMs` to avoid hanging tests when the stream never closes.
 */
export async function readSseEvents(
  response: APIResponse,
  maxMs = 60_000,
): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  const start = Date.now();
  const body = await response.body();
  const text = body.toString('utf-8');

  for (const chunk of text.split('\n\n')) {
    const line = chunk.trim();
    if (!line.startsWith('data:')) continue;
    const json = line.slice(5).trim();
    try {
      events.push(JSON.parse(json) as SseEvent);
    } catch {
      // ignore malformed lines (heartbeats, etc.)
    }
    if (Date.now() - start > maxMs) break;
  }
  return events;
}
