import { Inject, Injectable } from '@nestjs/common';
import { GetSubscriptionUseCase } from '../../stripe/application/get-subscription.use-case';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import { MONTHLY_CAPS, type Plan } from '../../analyze/domain/quota.policy';

// 'stripe_sprint' = a one-time Sprint pass (time-boxed hired grant). Distinct
// from 'stripe' so clients can tell it apart from a recurring subscription
// (e.g. a Sprint pass has no billing portal to manage).
export type EntitlementSource =
  | 'stripe'
  | 'stripe_sprint'
  | 'revenuecat'
  | 'none';

export type Entitlement = {
  plan: Plan;
  isPremium: boolean;
  isHired: boolean;
  /** Raw subscription status, or 'free' when there is no active subscription. */
  status: string;
  /** Which billing provider grants the active entitlement, 'none' when free. */
  source: EntitlementSource;
  currentPeriodEnd: Date | null;
  monthlyCap: number;
  creditsBalance: number;
};

/**
 * Single source of truth the apps (web + mobile) read to decide what the user
 * is entitled to, aggregating every billing provider. Both the Stripe and
 * RevenueCat webhooks persist into the same email-keyed Subscription table, so
 * one subscription read already reflects both — no live provider call. This is
 * entitlement only (what you may do); usage counters live in the quota summary.
 */
@Injectable()
export class GetEntitlementUseCase {
  constructor(
    private readonly getSubscription: GetSubscriptionUseCase,
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
  ) {}

  async execute(email: string): Promise<Entitlement> {
    const [sub, creditsBalance] = await Promise.all([
      this.getSubscription.execute(email),
      this.creditLedger.getBalance(email),
    ]);

    // Mirror isActive() in stripe/domain/subscription.types.ts: only 'active'
    // with a future period end counts. canceled/past_due/etc. fall back to free.
    const isActive =
      !!sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
    const plan: Plan = isActive
      ? sub.plan === 'hired'
        ? 'hired'
        : 'shortlisted'
      : 'free';

    return {
      plan,
      isPremium: plan !== 'free',
      isHired: plan === 'hired',
      status: sub ? sub.status : 'free',
      source: isActive ? sub.provider : 'none',
      currentPeriodEnd: sub ? sub.currentPeriodEnd : null,
      monthlyCap: MONTHLY_CAPS[plan],
      creditsBalance,
    };
  }
}
