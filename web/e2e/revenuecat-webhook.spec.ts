import { test, expect } from '@playwright/test';
import { apiContext } from './helpers/api';

// Contract test mirroring payment.spec.ts. We don't replay real RevenueCat
// events — we verify our trust boundary: /api/revenuecat/webhook rejects any
// request whose Authorization header doesn't match REVENUECAT_WEBHOOK_SECRET.
// (When the secret is unset the verifier fails closed, so these still hold.)
test.describe('RevenueCat webhook contract', () => {
  test('rejects a request with no Authorization header', async () => {
    const ctx = await apiContext();
    const res = await ctx.post('/api/revenuecat/webhook', {
      headers: { 'content-type': 'application/json' },
      data: {
        event: { type: 'INITIAL_PURCHASE', app_user_id: 'e2e@example.com' },
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test('rejects a request with a wrong Authorization secret', async () => {
    const ctx = await apiContext();
    const res = await ctx.post('/api/revenuecat/webhook', {
      headers: {
        'content-type': 'application/json',
        authorization: 'definitely-not-the-secret',
      },
      data: {
        event: { type: 'INITIAL_PURCHASE', app_user_id: 'e2e@example.com' },
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });
});
