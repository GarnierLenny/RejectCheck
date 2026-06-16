import { ConfigService } from '@nestjs/config';
import { Logger, type Provider } from '@nestjs/common';
import { Resend } from 'resend';
import { EMAIL_SENDER } from '../ports/tokens';
import type { EmailSenderPort } from '../ports/email-sender.port';
import { LoggerEmailAdapter } from './logger-email.adapter';
import { ResendEmailAdapter } from './resend-email.adapter';

const DEFAULT_FROM = 'RejectCheck <hello@rejectcheck.com>';

/**
 * Selects the email adapter at boot — the ONLY place the provider is chosen.
 * Resend when EMAIL_ENABLED==='true' AND RESEND_API_KEY is set; otherwise the
 * no-op LoggerEmailAdapter. This graceful degradation mirrors QueueModule's
 * REDIS_URL behaviour, so the app boots and works without any email config.
 * Switching ESP later = swap the adapter here; nothing upstream changes.
 */
export const emailSenderProvider: Provider = {
  provide: EMAIL_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): EmailSenderPort => {
    const logger = new Logger('EmailSenderProvider');
    const enabled = config.get<string>('EMAIL_ENABLED') === 'true';
    const apiKey = config.get<string>('RESEND_API_KEY');

    if (!enabled || !apiKey) {
      logger.warn(
        `Email sending disabled (EMAIL_ENABLED=${enabled}, hasKey=${!!apiKey}) ` +
          '— using LoggerEmailAdapter (emails are logged, not sent).',
      );
      return new LoggerEmailAdapter();
    }

    const from = config.get<string>('EMAIL_FROM') ?? DEFAULT_FROM;
    const replyTo = config.get<string>('EMAIL_REPLY_TO');
    logger.log(`Email sending enabled via Resend (from="${from}").`);
    return new ResendEmailAdapter(new Resend(apiKey), from, replyTo);
  },
};
