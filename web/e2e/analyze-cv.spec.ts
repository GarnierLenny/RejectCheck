import { test, expect } from '@playwright/test';
import { apiContext } from './helpers/api';
import { readSseEvents } from './helpers/sse';
import { loadFixturePdf } from './helpers/pdf';

// Golden path: an anonymous user uploads a CV + JD and gets a streamed analysis.
// This is the core MVP flow — if it breaks, no one can use the product.

test.describe('CV analysis golden path', () => {
  test('POST /api/analyze streams progress events ending with done', async () => {
    const ctx = await apiContext();
    const cv = loadFixturePdf();

    const res = await ctx.post('/api/analyze', {
      multipart: {
        cv: { name: 'cv.pdf', mimeType: 'application/pdf', buffer: cv },
        jobDescription:
          'Senior TypeScript engineer. Required: 5+ years TypeScript, React, Node.js, AWS. Build scalable web applications, mentor juniors, own production systems.',
        jobLabel: 'Senior TS Engineer',
        email: `e2e-${Date.now()}@example.com`,
        isRegistered: 'false',
      },
      timeout: 120_000,
    });

    expect(res.status(), await res.text().catch(() => '')).toBe(201);
    expect(res.headers()['content-type']).toContain('text/event-stream');

    const events = await readSseEvents(res, 120_000);
    expect(events.length).toBeGreaterThan(0);

    const last = events[events.length - 1];
    expect(['done', 'error']).toContain(last.step);

    if (last.step === 'error') {
      throw new Error(`Analyze stream errored: ${JSON.stringify(last)}`);
    }

    expect(last).toHaveProperty('result');
    await ctx.dispose();
  });

  test('POST /api/analyze rejects an empty job description', async () => {
    const ctx = await apiContext();
    const cv = loadFixturePdf();

    const res = await ctx.post('/api/analyze', {
      multipart: {
        cv: { name: 'cv.pdf', mimeType: 'application/pdf', buffer: cv },
        jobDescription: '',
        email: 'e2e-empty@example.com',
        isRegistered: 'false',
      },
    });

    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });
});
