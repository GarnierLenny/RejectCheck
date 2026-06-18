export type GrantCreditInput = {
  email: string;
  amount: number;
  source: 'purchase' | 'admin_grant';
  /**
   * Idempotency key. For Stripe purchases, the PaymentIntent id. For admin
   * grants, a stable tag (e.g. "support-2026-04-batch1-user42"). Two grants
   * with the same referenceId are a no-op.
   */
  referenceId: string;
};

export type ConsumeCreditInput = {
  email: string;
  /** The analysis this charge belongs to. */
  analysisId: number;
  /**
   * Namespaces the idempotency key so DISTINCT chargeable actions on the same
   * analysis don't collide on (type, referenceId) — concurrency-audit rule R3.
   * referenceId = `${analysisId}:${scope}`. Use a stable token per action:
   * 'analyze' (JD analysis), 'review' (CV audit), 'fixes' (the fix bundle),
   * 'rewrite' (a CV rewrite). Without this, a per-fix fan-out sharing the bare
   * analysisId would charge only the FIRST consume and silently free the rest.
   */
  scope: string;
  /** Credits to debit. See CREDIT_COSTS in quota.policy.ts. */
  amount: number;
};

/**
 * Append-only ledger backing the one-time credits feature. Balance is
 * computed on demand from `sum(grants) - sum(consumes)` — no mutable
 * counter, the row history is the source of truth.
 */
export interface CreditLedgerRepository {
  /** Returns 0 if the user has never received or consumed any credit. */
  getBalance(email: string): Promise<number>;
  /** Idempotent on (type='grant', referenceId). */
  grant(input: GrantCreditInput): Promise<void>;
  /** Idempotent on (type='consume', referenceId=`${analysisId}:${scope}`). */
  consume(input: ConsumeCreditInput): Promise<void>;
}
