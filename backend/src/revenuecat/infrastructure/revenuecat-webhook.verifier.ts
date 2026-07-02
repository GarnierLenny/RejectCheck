import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { RevenueCatWebhookVerifier } from '../ports/webhook-verifier';

/**
 * RevenueCat authenticates webhooks with a static shared secret sent in the
 * Authorization header (NOT a body HMAC like Stripe). We compare it in constant
 * time against REVENUECAT_WEBHOOK_SECRET. The secret is optional in env so the
 * backend boots before mobile billing is configured — but then this verifier
 * fails closed: every webhook is rejected until the secret is set.
 */
@Injectable()
export class SharedSecretRevenueCatVerifier implements RevenueCatWebhookVerifier {
  private readonly secret?: string;

  constructor(config: ConfigService) {
    this.secret = config.get<string>('REVENUECAT_WEBHOOK_SECRET') || undefined;
  }

  verify(authorizationHeader: string | undefined): void {
    if (!this.secret) {
      throw new UnauthorizedException(
        'RevenueCat webhook secret not configured',
      );
    }
    // RevenueCat sends the value verbatim; tolerate an optional "Bearer " prefix.
    const provided = (authorizationHeader ?? '').replace(/^Bearer\s+/i, '');
    const a = Buffer.from(provided);
    const b = Buffer.from(this.secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('RevenueCat webhook authorization failed');
    }
  }
}
