import { z } from 'zod';
import { SubscriptionPlan } from '@prisma/client';

/**
 * Subset of the RevenueCat v1 webhook payload we rely on. Unknown fields pass
 * through. Ref: https://www.revenuecat.com/docs/webhooks
 */
export const RevenueCatEventSchema = z.object({
  event: z
    .object({
      type: z.string(),
      id: z.string().optional(),
      app_user_id: z.string().optional(),
      original_app_user_id: z.string().optional(),
      entitlement_ids: z.array(z.string()).nullish(),
      entitlement_id: z.string().nullish(), // deprecated single-id form
      product_id: z.string().optional(),
      expiration_at_ms: z.number().nullish(),
      environment: z.string().optional(),
    })
    .passthrough(),
});

export type RevenueCatEvent = z.infer<typeof RevenueCatEventSchema>['event'];

/** Event types that mean "entitlement is active now" → upsert active. */
export const ACTIVATING_EVENTS: ReadonlySet<string> = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
]);

/**
 * Event types that revoke entitlement immediately. CANCELLATION is deliberately
 * NOT here: it only turns off auto-renew — access continues until EXPIRATION.
 */
export const REVOKING_EVENTS: ReadonlySet<string> = new Set(['EXPIRATION']);

/**
 * Map RevenueCat entitlement identifiers to our plan. The RevenueCat project
 * MUST name its entitlements 'hired' and 'shortlisted' to match. 'hired' wins
 * when both are present. Returns null when none map (handler skips + warns).
 */
export function entitlementToPlan(
  entitlementIds: readonly string[],
): SubscriptionPlan | null {
  if (entitlementIds.includes('hired')) return SubscriptionPlan.hired;
  if (entitlementIds.includes('shortlisted')) {
    return SubscriptionPlan.shortlisted;
  }
  return null;
}
