import type {
  Subscription,
  UpsertSubscriptionInput,
} from '../domain/subscription.types';

export interface SubscriptionRepository {
  findByEmail(email: string): Promise<Subscription | null>;

  /** Insert or update a subscription keyed by email. */
  upsert(input: UpsertSubscriptionInput): Promise<void>;

  /** Mark all subscriptions matching `stripeCustomerId` as canceled. Used by
   * the customer.subscription.deleted webhook handler. */
  cancelByCustomerId(stripeCustomerId: string): Promise<void>;
}
