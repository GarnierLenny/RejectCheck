/**
 * Pure policy: decides whether a user is allowed to run a new analysis.
 *
 * Three tiers:
 *  - guest (no email): 1 free analysis tracked by IP
 *  - connected (email, no subscription): 1 free analysis tracked by email
 *    (the legacy code uses count >= 1 — same threshold preserved here)
 *  - premium (email + active subscription): unlimited
 *
 * The function takes already-resolved counts and a subscription flag, so it
 * stays free of any DB or HTTP dependency.
 */

export type QuotaContext = {
  email?: string;
  ip?: string;
  hasActiveSubscription: boolean;
  countByEmail: number;
  countByIp: number;
};

export type QuotaDecision =
  | { allowed: true }
  | { allowed: false; reason: 'limit_reached' };

const FREE_ANALYSES_PER_EMAIL = 1;
const FREE_ANALYSES_PER_IP = 1;

export function decideQuota(ctx: QuotaContext): QuotaDecision {
  if (ctx.hasActiveSubscription) return { allowed: true };

  if (ctx.email && ctx.countByEmail >= FREE_ANALYSES_PER_EMAIL) {
    return { allowed: false, reason: 'limit_reached' };
  }

  if (ctx.ip && ctx.countByIp >= FREE_ANALYSES_PER_IP) {
    return { allowed: false, reason: 'limit_reached' };
  }

  return { allowed: true };
}
