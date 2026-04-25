import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';
import type {
  ParsedWebhookEvent,
  StripeWebhookParser,
} from '../ports/webhook-parser';

/**
 * Verifies the Stripe signature using the official SDK. The signature is the
 * sole trust boundary for webhook input — never use any field of the request
 * before this check passes.
 */
@Injectable()
export class StripeSdkWebhookParser implements StripeWebhookParser {
  private readonly webhookSecret: string;

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET')!;
  }

  parseAndVerify(rawBody: Buffer, signature: string): ParsedWebhookEvent {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
