import { Injectable, Logger } from '@nestjs/common';
import type { EmailSenderPort } from '../ports/email-sender.port';
import type { EmailMessage, EmailSendResult } from '../domain/email.types';

/**
 * No-op adapter that logs instead of sending. Selected by emailSenderProvider
 * whenever EMAIL_ENABLED !== 'true' or RESEND_API_KEY is missing — so local
 * dev, tests, and CI never send real mail. Mirrors QueueModule's in-process
 * fallback when REDIS_URL is unset.
 */
@Injectable()
export class LoggerEmailAdapter implements EmailSenderPort {
  private readonly logger = new Logger(LoggerEmailAdapter.name);

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.logger.log(
      `[email:skipped] to=${message.to} type=${message.type} ` +
        `locale=${message.locale} subject="${message.subject}" ` +
        `(LoggerEmailAdapter — not sent)`,
    );
    return { providerId: null, status: 'skipped' };
  }
}
