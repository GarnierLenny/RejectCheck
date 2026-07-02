/**
 * Single source of truth for one-time credit packs (backend).
 *
 * Pricing rule: a pack's price-per-analysis must stay ABOVE the subscription
 * rate so volume users are pushed to subscribe and packs stay a convenience
 * top-up — never a cheaper substitute that cannibalises the plans.
 *
 * Reference: analyse = 100 credits (see CREDIT_COSTS in analyze/domain/quota.policy).
 * Subscriptions bill ~1,33 €/analyse (Shortlisted 19,99 €/1500 cr = 15 analyses,
 * Hired 39,99 €/3000 cr = 30 analyses). Packs are priced above that:
 *
 *   500 cr  →  5 analyses → 8,99 €  = 1,80 €/analyse
 *   1000 cr → 10 analyses → 15,99 € = 1,60 €/analyse
 *   2000 cr → 20 analyses → 27,99 € = 1,40 €/analyse
 *
 * The frontend keeps its own display copy of these numbers (it can't import
 * backend code). Keep web/app/components/BuyCreditsModal.tsx and
 * web/app/(locale)/[lang]/credits/page.tsx in sync when this changes.
 */
export type CreditPack = { amountCents: number; label: string };

export const CREDIT_PACKS: Record<number, CreditPack> = {
  500: { amountCents: 899, label: "500 crédits d'analyse" },
  1000: { amountCents: 1599, label: "1000 crédits d'analyse" },
  2000: { amountCents: 2799, label: "2000 crédits d'analyse" },
};

/** Map of pack size (credits) → expected total in euro cents. Used by the
 * webhook handler to cross-check `amount_total` against the paid pack. */
export const CREDIT_PACK_AMOUNTS: Record<number, number> = Object.fromEntries(
  Object.entries(CREDIT_PACKS).map(([credits, pack]) => [
    Number(credits),
    pack.amountCents,
  ]),
);
