import { test, expect } from '@playwright/test';
import { apiContext } from './helpers/api';

// Strategy: we don't drive the Stripe Checkout UI (Stripe owns it and changes it
// often). Instead we verify the contract on our side:
//   1. POST /api/stripe/checkout returns a Stripe-hosted session URL
//   2. POST /api/stripe/webhook rejects unsigned payloads (signature verification works)
// Webhook-driven subscription upsert is best tested via Stripe CLI in a follow-up.

test.describe('Stripe payment contract', () => {
  test('checkout endpoint returns a Stripe session URL for shortlisted plan', async () => {
    const ctx = await apiContext();
    const res = await ctx.post('/api/stripe/checkout', {
      data: { plan: 'shortlisted', email: 'e2e-test@example.com' },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^https:\/\/(checkout\.)?stripe\.com\//);
    await ctx.dispose();
  });

  test('webhook rejects requests without a valid stripe-signature', async () => {
    const ctx = await apiContext();
    const res = await ctx.post('/api/stripe/webhook', {
      headers: { 'content-type': 'application/json' },
      data: { type: 'checkout.session.completed', data: { object: {} } },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test('checkout rejects an invalid plan name', async () => {
    const ctx = await apiContext();
    const res = await ctx.post('/api/stripe/checkout', {
      data: { plan: 'free-rider' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });
});
