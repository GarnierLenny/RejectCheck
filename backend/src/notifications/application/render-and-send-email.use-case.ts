import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EMAIL_SENDER } from '../ports/tokens';
import type { EmailSenderPort } from '../ports/email-sender.port';
import { EmailRenderer } from '../infrastructure/email-renderer';
import type { EmailJobPayload } from '../domain/email.types';

/**
 * Renders a queued email payload and hands it to the sender port, advancing the
 * EmailLog row (sent/skipped/failed) keyed by dedupeKey. Called by the BullMQ
 * EmailProcessor and by the in-process fallback. Suppression-list and
 * preference checks are added in cp4/P4 — the seam is here (right before send).
 */
@Injectable()
export class RenderAndSendEmailUseCase {
  private readonly logger = new Logger(RenderAndSendEmailUseCase.name);

  constructor(
    private readonly renderer: EmailRenderer,
    private readonly prisma: PrismaService,
    @Inject(EMAIL_SENDER) private readonly sender: EmailSenderPort,
  ) {}

  async execute(payload: EmailJobPayload): Promise<void> {
    // TODO(cp4/P4): skip if suppressed (hard bounce/complaint/unsubscribe) or
    // if a marketing email and the user opted out.
    const message = this.renderer.render(payload);
    const { dedupeKey } = payload;

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
