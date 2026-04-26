import { test, expect } from '@playwright/test';
import { apiContext } from './helpers/api';

// Revenue safety: paid endpoints (rewrite, cover-letter, saved-cvs) must reject
// unauthenticated requests. If a future change accidentally drops the guard,
// these tests catch the regression before merge.

const PREMIUM_ENDPOINTS = [
  { method: 'POST', path: '/api/analyze/rewrite', label: 'rewrite' },
  { method: 'POST', path: '/api/analyze/cover-letter', label: 'cover-letter' },
  { method: 'GET', path: '/api/analyze/saved-cvs', label: 'list saved cvs' },
  { method: 'POST', path: '/api/analyze/saved-cvs', label: 'save cv' },
] as const;

test.describe('Premium gating', () => {
  for (const ep of PREMIUM_ENDPOINTS) {
    test(`${ep.label} rejects unauthenticated requests`, async () => {
      const ctx = await apiContext();
      const res =
        ep.method === 'GET'
          ? await ctx.get(ep.path)
          : await ctx.post(ep.path, { data: {} });
      expect(res.status()).toBe(401);
      await ctx.dispose();
    });

    test(`${ep.label} rejects requests with an invalid bearer token`, async () => {
      const ctx = await apiContext();
      const headers = { authorization: 'Bearer invalid.jwt.token' };
      const res =
        ep.method === 'GET'
          ? await ctx.get(ep.path, { headers })
          : await ctx.post(ep.path, { headers, data: {} });
      expect(res.status()).toBe(401);
      await ctx.dispose();
    });
  }
});
