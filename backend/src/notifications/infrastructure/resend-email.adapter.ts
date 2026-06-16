import { Injectable, Logger } from '@nestjs/common';
import type { Resend } from 'resend';
import type { EmailSenderPort } from '../ports/email-sender.port';
import type { EmailMessage, EmailSendResult } from '../domain/email.types';

/**
 * Production adapter — delivers via Resend. Constructed by emailSenderProvider
 * only when EMAIL_ENABLED==='true' and RESEND_API_KEY is present, so this class
 * never runs in local dev unless explicitly turned on. Throws on provider
 * error so the BullMQ worker retries (attempts/backoff).
 */
@Injectable()
export class ResendEmailAdapter implements EmailSenderPort {
  private readonly logger = new Logger(ResendEmailAdapter.name);

  constructor(
    private readonly client: Resend,
    private readonly from: string,
    private readonly defaultReplyTo: string | undefined,
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(message.replyTo ?? this.defaultReplyTo
        ? { replyTo: message.replyTo ?? this.defaultReplyTo }
        : {}),
      ...(message.headers ? { headers: message.headers } : {}),
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message ?? String(error)}`);
    }
    this.logger.log(
      `[email:sent] to=${message.to} type=${message.type} id=${data?.id ?? '?'}`,
    );
    return { providerId: data?.id ?? null, status: 'sent' };
  }
}
