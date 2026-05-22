import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import { GetSubscriptionUseCase } from '../../stripe/application/get-subscription.use-case';
import {
  MONTHLY_CAPS,
  startOfMonthUTC,
  type Plan,
} from '../domain/quota.policy';

export type QuotaSummary = {
  plan: Plan;
  /** 'free' for users without an active subscription. */
  status: string;
  currentPeriodEnd: Date | null;
  monthlyCap: number;
  monthlyUsed: number;
  creditsBalance: number;
};

/**
 * Read-only orchestrator that composes subscription state + monthly analysis
 * count + credit balance for a single authenticated user. Used by both the
 * dashboard quota card and the analyze page paywall logic on the frontend.
 *
 * Lives in the analyze bounded context because the quota policy and monthly
 * window concept belong here, not in stripe.
 */
@Injectable()
export class GetQuotaSummaryUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
    private readonly getSubscription: GetSubscriptionUseCase,
  ) {}

  async execute(email: string): Promise<QuotaSummary> {
    const monthStart = startOfMonthUTC();
    const [subscription, monthlyUsed, creditsBalance] = await Promise.all([
      this.getSubscription.execute(email),
      this.analyses.creditsSince(email, monthStart),
      this.creditLedger.getBalance(email),
    ]);

    // Resolve the plan from the active subscription. A canceled / past_due /
    // unpaid sub falls back to 'free' so the cap reflects what the user can
    // actually use right now. The active predicate matches isActive() in
    // stripe/domain/subscription.types.ts (kept inline to avoid widening that
    // helper to also accept the lighter SubscriptionSummary shape).
    const isCurrentlyActive =
      !!subscription &&
      subscription.status === 'active' &&
      subscription.currentPeriodEnd > new Date();
    const plan: Plan = isCurrentlyActive
      ? subscription.plan === 'hired'
        ? 'hired'
        : 'shortlisted'
      : 'free';

    return {
      plan,
      status: subscription ? subscription.status : 'free',
      currentPeriodEnd: subscription ? subscription.currentPeriodEnd : null,
      monthlyCap: MONTHLY_CAPS[plan],
      monthlyUsed,
      creditsBalance,
    };
  }
}
