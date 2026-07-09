import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';

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
import { GetFounderAvailabilityUseCase } from './application/get-founder-availability.use-case';
import { CreateCreditsCheckoutSessionUseCase } from './application/create-credits-checkout-session.use-case';
import { CreateAnalysisUnlockCheckoutSessionUseCase } from './application/create-analysis-unlock-checkout-session.use-case';
import { CreatePortalSessionUseCase } from './application/create-portal-session.use-case';
import { CheckSubscriptionUseCase } from './application/check-subscription.use-case';
import { GetSubscriptionUseCase } from './application/get-subscription.use-case';
import { HandleCheckoutCompletedUseCase } from './application/handle-checkout-completed.use-case';
import { HandleCreditPurchaseUseCase } from './application/handle-credit-purchase.use-case';
import { HandleAnalysisUnlockUseCase } from './application/handle-analysis-unlock.use-case';
import { HandleSubscriptionUpdatedUseCase } from './application/handle-subscription-updated.use-case';
import { HandleSubscriptionDeletedUseCase } from './application/handle-subscription-deleted.use-case';
import { HandleWebhookUseCase } from './application/handle-webhook.use-case';

import { PremiumGuard } from './guards/premium.guard';

@Module({
  imports: [PrismaModule, CreditsModule],
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
    GetFounderAvailabilityUseCase,
    CreateCreditsCheckoutSessionUseCase,
    CreateAnalysisUnlockCheckoutSessionUseCase,
    CreatePortalSessionUseCase,
    CheckSubscriptionUseCase,
    GetSubscriptionUseCase,
    HandleCheckoutCompletedUseCase,
    HandleCreditPurchaseUseCase,
    HandleAnalysisUnlockUseCase,
    HandleSubscriptionUpdatedUseCase,
    HandleSubscriptionDeletedUseCase,
    HandleWebhookUseCase,

    // Guard (consumed by other modules via @RequiresPremium)
    PremiumGuard,
  ],
  exports: [
    STRIPE_CLIENT,
    SUBSCRIPTION_GATE,
    PremiumGuard,
    // Re-export the use case so other modules can resolve it directly when
    // they need server-side checks outside an HTTP request lifecycle.
    CheckSubscriptionUseCase,
    // Exposed so AnalyzeModule (GetQuotaSummaryUseCase) can read the
    // current subscription summary without depending on the repository.
    GetSubscriptionUseCase,
    // Subscription persistence is shared billing infra: RevenueCatModule writes
    // entitlement into the same table (provider='revenuecat') via this port.
    SUBSCRIPTION_REPOSITORY,
  ],
})
export class StripeModule {}
