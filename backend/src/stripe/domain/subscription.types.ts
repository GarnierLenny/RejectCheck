import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

/**
 * Domain view of a subscription. Mirrors the persistence row but is decoupled
 * from Prisma — repository adapters do the mapping.
 */
export type Subscription = {
  email: string;
  stripeCustomerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
};

export type SubscriptionSummary = Pick<
  Subscription,
  'plan' | 'status' | 'currentPeriodEnd'
>;

export type UpsertSubscriptionInput = Subscription;

/**
 * Predicate used both by use cases and by the SubscriptionGate. Centralised
 * here so "active" is defined in exactly one place.
 */
export function isActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === 'active' && sub.currentPeriodEnd > new Date();
}

export function isHiredAndActive(sub: Subscription | null): boolean {
  return isActive(sub) && sub?.plan === 'hired';
}
