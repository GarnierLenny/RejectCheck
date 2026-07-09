import type { StripeClient } from '../ports/stripe-client';

/**
 * Founder deal — an early-adopter offer: full Hired access at a locked-in
 * discounted price, capped at the first {@link FOUNDER_SEAT_CAP} subscribers.
 *
 * A founder subscription is persisted as `plan='hired'` (see
 * create-checkout-session.use-case.ts and handle-subscription-updated's
 * resolvePlan), so every downstream access check treats founders exactly like
 * Hired subscribers. The ONLY thing that distinguishes a founder is the Stripe
 * price they're subscribed to — which is also how we count occupied seats.
 */
export const FOUNDER_SEAT_CAP = 100;

/** Subscription statuses that still occupy a founder seat. `past_due` counts:
 *  the subscription still exists on the founder price (payment is retrying, not
 *  yet canceled) so it holds a seat. Terminal states (`canceled`,
 *  `incomplete_expired`, `unpaid`) free the seat. */
const OCCUPIES_SEAT = new Set(['active', 'trialing', 'past_due']);

/**
 * Counts how many of the capped founder seats are currently taken by querying
 * Stripe for subscriptions on the founder price. Auto-paginates; safe up to a
 * few thousand subs (the cap keeps this tiny in practice).
 */
export async function countActiveFounderSeats(
  stripe: StripeClient,
  founderPriceId: string,
): Promise<number> {
  let taken = 0;
  for await (const sub of stripe.subscriptions.list({
    price: founderPriceId,
    status: 'all',
    limit: 100,
  })) {
    if (OCCUPIES_SEAT.has(sub.status)) taken += 1;
  }
  return taken;
}
