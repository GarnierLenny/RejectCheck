import type { EmailMessage, EmailSendResult } from '../domain/email.types';

/**
 * Lowest-level outbound-email boundary. One method: take a fully-rendered
 * message and deliver it. Implemented by ResendEmailAdapter (prod) and
 * LoggerEmailAdapter (dev/no-op). Swapping ESP = a new adapter, nothing above
 * this line changes.
 */
export interface EmailSenderPort {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
