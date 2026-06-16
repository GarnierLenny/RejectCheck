/**
 * Domain types for outbound email. The domain knows nothing about Resend or
 * any provider — an EmailMessage is a fully-rendered, ready-to-send message;
 * the EmailSenderPort hands it to whichever adapter is wired at boot.
 */

export type EmailLocale = 'en' | 'fr';

/** Transactional = contract/legitimate-interest, always sent. Marketing =
 *  opt-out (drips); suppressed for unsubscribed users. */
export type EmailCategory = 'transactional' | 'marketing';

export type EmailType = 'welcome' | 'analysis_ready' | 'drip_d1' | 'drip_d3';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** plain-text fallback — improves deliverability; optional for now */
  text?: string;
  /** overrides the adapter default reply-to when set */
  replyTo?: string;
  /** extra headers, e.g. List-Unsubscribe / List-Unsubscribe-Post (RFC 8058) */
  headers?: Record<string, string>;
  category: EmailCategory;
  type: EmailType;
  locale: EmailLocale;
}

export interface EmailSendResult {
  /** provider message id when actually sent; null when skipped (logger adapter) */
  providerId: string | null;
  status: 'sent' | 'skipped';
}

/**
 * Per-type data needed to render an email. Discriminated by `type` so each
 * template gets exactly the fields it needs. The renderer turns this + locale
 * into a ready-to-send EmailMessage.
 */
export type EmailContext =
  | { type: 'welcome'; firstName?: string | null }
  | { type: 'analysis_ready'; analysisId: number; role?: string | null }
  | { type: 'drip_d1' }
  | { type: 'drip_d3' };

/**
 * What travels on the BullMQ EMAIL_QUEUE (and the in-process fallback). Kept
 * small: recipient + locale + the typed context. `dedupeKey` becomes the
 * BullMQ jobId so a duplicate enqueue is a no-op (idempotent at the queue
 * layer; the EmailLog table adds DB-level idempotency in a later checkpoint).
 */
export interface EmailJobPayload {
  to: string;
  locale: EmailLocale;
  context: EmailContext;
  dedupeKey?: string;
}

/** Drips are marketing (opt-out); everything else is transactional. */
export function emailCategoryOf(type: EmailType): EmailCategory {
  return type === 'drip_d1' || type === 'drip_d3' ? 'marketing' : 'transactional';
}

/**
 * Stable idempotency key when the caller doesn't pass one. Welcome/drips are
 * once-per-recipient; analysis_ready is once-per-analysis.
 */
export function defaultDedupeKey(payload: EmailJobPayload): string {
  const { context, to } = payload;
  if (context.type === 'analysis_ready') {
    return `analysis_ready:${to}:${context.analysisId}`;
  }
  return `${context.type}:${to}`;
}
