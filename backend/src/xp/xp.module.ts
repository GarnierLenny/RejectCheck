import { Module } from '@nestjs/common';
import { StripeModule } from '../stripe/stripe.module';
import { XpController } from './xp.controller';
import { STRIPE_COUPON_SERVICE, XP_REPOSITORY } from './ports/tokens';
import { PrismaXpRepository } from './infrastructure/prisma-xp.repository';
import { StripeCouponServiceImpl } from './infrastructure/stripe-coupon.service';
import { AwardXpUseCase } from './application/award-xp.use-case';
import { CheckTierRewardsUseCase } from './application/check-tier-rewards.use-case';
import { GetUserXpUseCase } from './application/get-user-xp.use-case';
import { GetLedgerUseCase } from './application/get-ledger.use-case';
import { GetRewardsUseCase } from './application/get-rewards.use-case';

@Module({
  imports: [StripeModule],
  controllers: [XpController],
  providers: [
    { provide: XP_REPOSITORY, useClass: PrismaXpRepository },
    { provide: STRIPE_COUPON_SERVICE, useClass: StripeCouponServiceImpl },
    AwardXpUseCase,
    CheckTierRewardsUseCase,
    GetUserXpUseCase,
    GetLedgerUseCase,
    GetRewardsUseCase,
  ],
  exports: [AwardXpUseCase],
})
export class XpModule {}
