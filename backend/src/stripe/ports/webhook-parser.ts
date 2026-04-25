/**
 * Stripe events are extremely variant — the SDK ships ~100+ event types.
 * Rather than depending on a heavy type tree from the SDK (which has awkward
 * namespace exports through `export = `), we treat the parsed event as a
 * generic envelope here and have each event-handler use case validate its own
 * payload via Zod (or trust the post-signature Stripe data shape).
 *
 * The trust boundary is `parseAndVerify`: it MUST throw if the signature is
 * invalid. Everything downstream relies on that.
 */
export type ParsedWebhookEvent = {
  type: string;
  data: { object: unknown };
};

export interface StripeWebhookParser {
  parseAndVerify(rawBody: Buffer, signature: string): ParsedWebhookEvent;
}
