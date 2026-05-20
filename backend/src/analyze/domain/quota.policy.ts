/**
 * Pure policy: decides whether a user is allowed to run a new analysis and,
 * if so, whether the cost comes out of their monthly plan allowance or
 * their one-time credit balance.
 *
 * Four input shapes:
 *  - guest (no email): 1 free analysis ever, tracked by IP
 *  - free (email, no subscription): MONTHLY_CAPS.free per calendar month UTC
 *  - shortlisted: MONTHLY_CAPS.shortlisted per month
 *  - hired: MONTHLY_CAPS.hired per month
 *
 * Past the monthly cap, registered users fall back to one-time credits
 * (`creditsBalance` > 0). Anonymous users have no such fallback.
 *
 * The function takes already-resolved counts and balances, so it stays
 * free of any DB or HTTP dependency and is trivially testable.
 *
 * Concurrency note: at the volume RejectCheck currently runs at, two
 * simultaneous analyses from the same user can each pass `decideQuota` and
 * overshoot the cap by 1. Acceptable trade-off vs adding pessimistic locks
 * — revisit if usage patterns make this user-visible.
 */

export type Plan = 'free' | 'shortlisted' | 'hired';

export const MONTHLY_CAPS: Record<Plan, number> = {
  free: 3,
  shortlisted: 15,
  hired: 30,
};

export const CREDIT_COSTS = {
  analyze: 100,
  review: 50,
} as const;

export const ANONYMOUS_LIFETIME_CAP = 1;

export type QuotaContext = {
  email?: string;
  ip?: string;
  plan: Plan;
  /**
   * Analyses already created this calendar month UTC for this user. The
   * caller computes this via `countByEmailSince(email, startOfMonthUTC())`.
   */
  monthlyUsed: number;
  /**
   * Lifetime IP-based count for anonymous users (no email). Ignored when
   * `email` is set.
   */
  countByIpLifetime: number;
  /** sum(grants) - sum(consumes). Treat as 0 for anonymous users. */
  creditsBalance: number;
  /** Credits required to run this action. See CREDIT_COSTS. */
  actionCost: number;
};

export type QuotaDecision =
  | {
      allowed: true;
      /**
       * Which bucket the analysis will draw from. The caller uses this to
       * decide whether to write a CreditLedger consume row after the hot
       * pass succeeds.
       */
      consume: 'monthly' | 'credit' | 'anonymous';
    }
  | {
      allowed: false;
      reason: 'limit_reached';
      plan: Plan;
      monthlyCap: number;
    };

export function decideQuota(ctx: QuotaContext): QuotaDecision {
  // Anonymous flow: no plan, no credits — just the lifetime IP cap.
  if (!ctx.email) {
    if (ctx.ip && ctx.countByIpLifetime >= ANONYMOUS_LIFETIME_CAP) {
      return {
        allowed: false,
        reason: 'limit_reached',
        plan: 'free',
        monthlyCap: ANONYMOUS_LIFETIME_CAP,
      };
    }
    return { allowed: true, consume: 'anonymous' };
  }

  const cap = MONTHLY_CAPS[ctx.plan];

  if (ctx.monthlyUsed < cap) {
    return { allowed: true, consume: 'monthly' };
  }

  if (ctx.creditsBalance >= ctx.actionCost) {
    return { allowed: true, consume: 'credit' };
  }

  return {
    allowed: false,
    reason: 'limit_reached',
    plan: ctx.plan,
    monthlyCap: cap,
  };
}

/** First instant of the current calendar month in UTC. */
export function startOfMonthUTC(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
