import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';

export type CreateCheckoutSessionCommand = {
  plan: 'shortlisted' | 'hired';
  customerEmail?: string;
};

export type CreateCheckoutSessionResult = {
  url: string | null;
};

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: CreateCheckoutSessionCommand,
  ): Promise<CreateCheckoutSessionResult> {
    const priceId =
      cmd.plan === 'shortlisted'
        ? this.config.get<string>('STRIPE_SHORTLISTED_PRICE_ID')!
        : this.config.get<string>('STRIPE_HIRED_PRICE_ID')!;

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard?success=true`,
      cancel_url: `${frontendUrl}/pricing?error=true`,
      ...(cmd.customerEmail ? { customer_email: cmd.customerEmail } : {}),
      metadata: { plan: cmd.plan, email: cmd.customerEmail || '' },
    });

    return { url: session.url };
  }
}
