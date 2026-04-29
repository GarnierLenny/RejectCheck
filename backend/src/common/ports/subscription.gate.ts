/**
 * Project-wide port for subscription state. Implemented by Stripe (default)
 * but kept abstract so future adapters (test fixtures, alt billing) plug in
 * without touching consumers.
 */
export interface SubscriptionGate {
  /** True when the user has any active paid plan (shortlisted or hired). */
  isPremium(email: string): Promise<boolean>;
  /** True only for the top "hired" tier — gates the cover letter feature. */
  isHired(email: string): Promise<boolean>;
  /**
   * Combined lookup — fetches both flags in a single DB roundtrip.
   * Prefer this over calling isPremium + isHired sequentially.
   */
  getState(email: string): Promise<SubscriptionState>;
}

export type SubscriptionState = {
  hasActiveSubscription: boolean;
  isHired: boolean;
};
