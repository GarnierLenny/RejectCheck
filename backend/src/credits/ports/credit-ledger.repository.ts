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
  /**
   * Idempotency key. One consume per analysis row — a retried analyze flow
   * cannot double-debit.
   */
  analysisId: number;
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
  /** Idempotent on (type='consume', referenceId=analysisId.toString()). */
  consume(input: ConsumeCreditInput): Promise<void>;
}
