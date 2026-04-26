/**
 * Module-local DI tokens for stripe ports. The cross-cutting SUBSCRIPTION_GATE
 * lives in common/ports/tokens.ts (consumed by every other module) — keep it
 * separate from these.
 */
export const SUBSCRIPTION_REPOSITORY = Symbol('SubscriptionRepository');
export const STRIPE_CLIENT = Symbol('StripeClient');
export const WEBHOOK_PARSER = Symbol('StripeWebhookParser');
