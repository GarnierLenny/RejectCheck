import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EMAIL_SENDER } from '../ports/tokens';
import type { EmailSenderPort } from '../ports/email-sender.port';
import { EmailRenderer } from '../infrastructure/email-renderer';
import { UnsubscribeService } from './unsubscribe.service';
import type { EmailJobPayload } from '../domain/email.types';

/**
 * Renders a queued email payload and hands it to the sender port, advancing the
 * EmailLog row (sent/skipped/failed) keyed by dedupeKey. Called by the BullMQ
 * EmailProcessor and by the in-process fallback. Honours the suppression list
 * (hard bounce/complaint block all; unsubscribe blocks marketing) and adds the
 * one-click List-Unsubscribe headers to marketing mail.
 */
@Injectable()
export class RenderAndSendEmailUseCase {
  private readonly logger = new Logger(RenderAndSendEmailUseCase.name);

  constructor(
    private readonly renderer: EmailRenderer,
    private readonly prisma: PrismaService,
    private readonly unsubscribe: UnsubscribeService,
    @Inject(EMAIL_SENDER) private readonly sender: EmailSenderPort,
  ) {}

  async execute(payload: EmailJobPayload): Promise<void> {
    const rendered = this.renderer.render(payload);
    const { dedupeKey } = payload;

    if (await this.unsubscribe.isSuppressed(rendered.to, rendered.category)) {
      if (dedupeKey) {
        await this.prisma.emailLog
          .update({ where: { dedupeKey }, data: { status: 'skipped' } })
          .catch(() => undefined);
      }
      this.logger.log(
        `email suppressed type=${rendered.type} to=${rendered.to} (on suppression list)`,
      );
      return;
    }

    const message = this.unsubscribe.withUnsubscribeHeaders(rendered);

    try {
      const result = await this.sender.send(message);
      if (dedupeKey) {
        await this.prisma.emailLog
          .update({
            where: { dedupeKey },
            data: {
              status: result.status === 'sent' ? 'sent' : 'skipped',
              providerId: result.providerId,
              sentAt: new Date(),
            },
          })
          .catch(() => undefined); // log row may be absent for ad-hoc sends
      }
      this.logger.log(
        `email ${result.status} type=${message.type} to=${message.to} ` +
          `id=${result.providerId ?? '-'}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (dedupeKey) {
        await this.prisma.emailLog
          .update({ where: { dedupeKey }, data: { status: 'failed', error: msg } })
          .catch(() => undefined);
      }
      throw err;
    }
  }
}
