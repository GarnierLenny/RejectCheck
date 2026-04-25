import { ConfigService } from '@nestjs/config';
import StripeLib = require('stripe');
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';

/**
 * Factory provider for the Stripe SDK instance. Lives at infrastructure level
 * because instantiating the SDK is an infrastructure concern. Use cases get
 * a typed client via @Inject(STRIPE_CLIENT).
 */
export const stripeClientProvider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): StripeClient => {
    const apiKey = config.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      // Should never happen — env validation runs at boot. Defensive guard for
      // the case someone bypasses validation in tests.
      throw new Error('STRIPE_SECRET_KEY is required to instantiate Stripe');
    }
    return new StripeLib(apiKey, {
      // narrows apiVersion to a literal union; pinning a tested version is fine.
      apiVersion: '2024-06-20' as any,
    });
  },
};
