import type { SubscriptionProvider } from '@prisma/client';
import type {
  Subscription,
  SubscriptionRefresh,
  UpsertSubscriptionInput,
} from '../domain/subscription.types';

export interface SubscriptionRepository {
  /** The user's single *effective* subscription across providers: the active
   * hired one if any, else any active one, else the most recently updated row
   * (so callers still see the latest canceled/expired state). */
  findByEmail(email: string): Promise<Subscription | null>;

  /** The Stripe customer id for this email (the stripe-provider row), or null.
   * Used to open a billing portal session — RevenueCat rows have no customer. */
  findStripeCustomerIdByEmail(email: string): Promise<string | null>;

  /** Insert or update a subscription keyed by (email, provider). */
  upsert(input: UpsertSubscriptionInput): Promise<void>;

  /** Refresh status/currentPeriodEnd (and optionally plan) for the Stripe row(s)
   * matching `stripeCustomerId`. Used by the customer.subscription.updated
   * webhook handler so renewals keep the local `currentPeriodEnd` in sync — a
   * no-op if no matching row exists (the row is created by checkout). */
  refreshByCustomerId(
    stripeCustomerId: string,
    patch: SubscriptionRefresh,
  ): Promise<void>;

  /** Mark all subscriptions matching `stripeCustomerId` as canceled. Used by
   * the Stripe customer.subscription.deleted webhook handler. */
  cancelByCustomerId(stripeCustomerId: string): Promise<void>;

  /** Mark the (email, provider) subscription as canceled. Used by the RevenueCat
   * expiration handler so a RevenueCat event never cancels a Stripe-sourced row
   * (and vice-versa). */
  cancelByEmailAndProvider(
    email: string,
    provider: SubscriptionProvider,
  ): Promise<void>;
}
