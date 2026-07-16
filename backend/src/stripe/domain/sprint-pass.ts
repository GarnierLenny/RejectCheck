/**
 * Sprint pass: a one-time payment that grants hired-tier access for a bounded
 * window, then expires. It exists because job search is episodic (a monthly
 * subscription is the wrong container for a use that ends at "hired"): the
 * Sprint pass lets a candidate pay once for a single search.
 *
 * The grant is stored as a Subscription row with provider `stripe_sprint`,
 * plan `hired`, and `currentPeriodEnd` = purchase time + this duration, so the
 * existing `isActive()` predicate and `pickEffective()` resolution treat it as
 * hired-tier until it expires, with zero changes to entitlement/quota reads.
 *
 * The actual charge is set in Stripe via STRIPE_SPRINT_PRICE_ID; only the
 * duration lives here. Keep the display price on the frontend in sync with the
 * Stripe price.
 */

/** How long a Sprint pass grants hired-tier access, in days. */
export const SPRINT_PASS_DURATION_DAYS = 45;

/** Same duration in milliseconds, for date arithmetic. */
export const SPRINT_PASS_DURATION_MS =
  SPRINT_PASS_DURATION_DAYS * 24 * 60 * 60 * 1000;
