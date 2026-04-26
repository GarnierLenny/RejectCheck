import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { SUBSCRIPTION_GATE } from '../common/ports/tokens';
import {
  STRIPE_CLIENT,
  SUBSCRIPTION_REPOSITORY,
  WEBHOOK_PARSER,
} from './ports/tokens';

import { stripeClientProvider } from './infrastructure/stripe-client.factory';
import { PrismaSubscriptionRepository } from './infrastructure/prisma-subscription.repository';
import { StripeSdkWebhookParser } from './infrastructure/stripe-webhook.parser';
import { StripeSubscriptionGate } from './infrastructure/stripe-subscription.gate';

import { CreateCheckoutSessionUseCase } from './application/create-checkout-session.use-case';
import { CheckSubscriptionUseCase } from './application/check-subscription.use-case';
import { GetSubscriptionUseCase } from './application/get-subscription.use-case';
import { HandleCheckoutCompletedUseCase } from './application/handle-checkout-completed.use-case';
import { HandleSubscriptionDeletedUseCase } from './application/handle-subscription-deleted.use-case';
import { HandleWebhookUseCase } from './application/handle-webhook.use-case';

import { PremiumGuard } from './guards/premium.guard';

@Module({
  imports: [PrismaModule],
  controllers: [StripeController],
  providers: [
    // Adapters bound to ports
    stripeClientProvider, // STRIPE_CLIENT
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: PrismaSubscriptionRepository,
    },
    { provide: WEBHOOK_PARSER, useClass: StripeSdkWebhookParser },
    { provide: SUBSCRIPTION_GATE, useClass: StripeSubscriptionGate },

    // Use cases
    CreateCheckoutSessionUseCase,
    CheckSubscriptionUseCase,
    GetSubscriptionUseCase,
    HandleCheckoutCompletedUseCase,
    HandleSubscriptionDeletedUseCase,
    HandleWebhookUseCase,

    // Guard (consumed by other modules via @RequiresPremium)
    PremiumGuard,
  ],
  exports: [
    SUBSCRIPTION_GATE,
    PremiumGuard,
    // Re-export the use case so other modules can resolve it directly when
    // they need server-side checks outside an HTTP request lifecycle.
    CheckSubscriptionUseCase,
  ],
})
export class StripeModule {}
