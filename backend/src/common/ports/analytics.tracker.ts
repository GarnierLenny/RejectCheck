/**
 * Server-side analytics port. A cleared payment is only known at the Stripe
 * webhook, so paid-conversion events are emitted here (not client-side, where a
 * closed tab or ad-blocker would drop them).
 */

export type AnalyticsEvent = {
  event: string;
  /** Ties the event to a person. We use email, matching the frontend identify. */
  distinctId: string;
  properties?: Record<string, unknown>;
};

/**
 * Fire-and-forget: implementations must never throw into the caller — a webhook
 * must not 500 because analytics is unavailable.
 */
export interface AnalyticsTracker {
  capture(event: AnalyticsEvent): void;
}
