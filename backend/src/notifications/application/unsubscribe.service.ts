import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { EmailCategory, EmailMessage } from '../domain/email.types';

/**
 * Owns unsubscribe tokens, the List-Unsubscribe headers, and the suppression
 * check applied before every send.
 *
 * Token = base64url(email).hmacHex — stateless (no per-user token row). A
 * recipient can only ever unsubscribe themselves; a forged token is low
 * severity (worst case: unsubscribes one address).
 */
@Injectable()
export class UnsubscribeService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get secret(): string {
    return (
      this.config.get<string>('EMAIL_UNSUBSCRIBE_SECRET') ??
      'rejectcheck-dev-unsubscribe-secret'
    );
  }

  private get backendUrl(): string {
    return (
      this.config.get<string>('BACKEND_PUBLIC_URL') ??
      'https://api.rejectcheck.com'
    );
  }

  private sign(email: string): string {
    return createHmac('sha256', this.secret).update(email).digest('hex');
  }

  tokenFor(email: string): string {
    const e = Buffer.from(email, 'utf8').toString('base64url');
    return `${e}.${this.sign(email)}`;
  }

  /** Returns the email if the token is authentic, else null. */
  verify(token: string): string | null {
    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;
    const email = Buffer.from(token.slice(0, dot), 'base64url').toString('utf8');
    const given = token.slice(dot + 1);
    const expected = this.sign(email);
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return email;
  }

  unsubscribeUrl(email: string): string {
    return `${this.backendUrl}/api/email/unsubscribe?token=${encodeURIComponent(this.tokenFor(email))}`;
  }

  /** RFC 8058 one-click headers — added to marketing emails (drips). */
  listUnsubscribeHeaders(email: string): Record<string, string> {
    return {
      'List-Unsubscribe': `<${this.unsubscribeUrl(email)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  /** Adds an address to the suppression list (idempotent upsert). */
  async suppress(
    email: string,
    reason: 'unsubscribe' | 'hard_bounce' | 'complaint' | 'manual',
  ): Promise<void> {
    await this.prisma.suppression.upsert({
      where: { email },
      update: { reason },
      create: { email, reason },
    });
  }

  /**
   * True if a message to `email` of this `category` must be skipped:
   *  - hard_bounce / complaint → block everything,
   *  - unsubscribe → block marketing only.
   */
  async isSuppressed(email: string, category: EmailCategory): Promise<boolean> {
    const row = await this.prisma.suppression.findUnique({ where: { email } });
    if (!row) return false;
    if (row.reason === 'hard_bounce' || row.reason === 'complaint') return true;
    return category === 'marketing'; // unsubscribe / manual
  }

  /** Decorate a rendered message with List-Unsubscribe headers when marketing. */
  withUnsubscribeHeaders(message: EmailMessage): EmailMessage {
    if (message.category !== 'marketing') return message;
    return {
      ...message,
      headers: { ...message.headers, ...this.listUnsubscribeHeaders(message.to) },
    };
  }
}
