import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionProvider,
} from '@prisma/client';

/**
 * Domain view of a subscription. Mirrors the persistence row but is decoupled
 * from Prisma — repository adapters do the mapping.
 */
export type Subscription = {
  email: string;
  provider: SubscriptionProvider;
  /** Stripe rows only — null for RevenueCat. */
  stripeCustomerId?: string | null;
  /** RevenueCat app_user_id (audit/lookup) — null for Stripe. */
  externalRef?: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
};

export type SubscriptionSummary = Pick<
  Subscription,
  'plan' | 'status' | 'currentPeriodEnd' | 'provider'
>;

export type UpsertSubscriptionInput = Subscription;

/**
 * Partial update applied to an existing Stripe row on
 * `customer.subscription.updated` (renewals, status transitions, plan changes).
 * `plan` is optional: omit it to preserve the stored plan when the event's price
 * doesn't map to a known plan (e.g. a legacy grandfathered price).
 */
export type SubscriptionRefresh = {
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  plan?: SubscriptionPlan;
};

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
