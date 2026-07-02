import { Module } from '@nestjs/common';
import { StripeModule } from '../stripe/stripe.module';
import { CreditsModule } from '../credits/credits.module';
import { MeController } from './me.controller';
import { GetEntitlementUseCase } from './application/get-entitlement.use-case';

/**
 * Cross-provider entitlement read surface. Imports StripeModule (for
 * GetSubscriptionUseCase — which already returns the effective subscription
 * across providers) and CreditsModule (for the credit balance). No dependency
 * on AnalyzeModule: the quota *caps* come from the pure quota.policy constants.
 */
@Module({
  imports: [StripeModule, CreditsModule],
  controllers: [MeController],
  providers: [GetEntitlementUseCase],
})
export class MeModule {}
