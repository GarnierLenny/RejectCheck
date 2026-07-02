import { Module } from '@nestjs/common';
import { StripeModule } from '../stripe/stripe.module';
import { RevenueCatController } from './revenuecat.controller';
import { REVENUECAT_WEBHOOK_VERIFIER } from './ports/tokens';
import { SharedSecretRevenueCatVerifier } from './infrastructure/revenuecat-webhook.verifier';
import { HandleRevenueCatWebhookUseCase } from './application/handle-revenuecat-webhook.use-case';

/**
 * Mobile in-app purchases via RevenueCat. The webhook writes entitlement into
 * the SAME email-keyed Subscription table the Stripe webhook uses
 * (provider='revenuecat'), so the existing SubscriptionGate / quota path
 * aggregates both sources automatically. Reuses SUBSCRIPTION_REPOSITORY
 * exported by StripeModule (subscription persistence is shared billing infra).
 */
@Module({
  imports: [StripeModule],
  controllers: [RevenueCatController],
  providers: [
    {
      provide: REVENUECAT_WEBHOOK_VERIFIER,
      useClass: SharedSecretRevenueCatVerifier,
    },
    HandleRevenueCatWebhookUseCase,
  ],
})
export class RevenueCatModule {}
