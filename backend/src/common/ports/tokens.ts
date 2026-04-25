/**
 * Project-wide DI tokens for cross-cutting ports. Keep this list small —
 * module-local ports stay in their own `ports/tokens.ts`.
 */
export const SUBSCRIPTION_GATE = Symbol('SubscriptionGate');
