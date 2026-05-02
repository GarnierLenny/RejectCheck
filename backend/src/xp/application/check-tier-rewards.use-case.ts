import { Inject, Injectable, Logger } from '@nestjs/common';
import { STRIPE_COUPON_SERVICE, XP_REPOSITORY } from '../ports/tokens';
import type { XpRepository } from '../ports/xp.repository';
import type { StripeCouponService } from '../ports/stripe-coupon.service';
import { REWARDS, type RewardKey } from '../domain/tier-config';

@Injectable()
export class CheckTierRewardsUseCase {
  private readonly logger = new Logger(CheckTierRewardsUseCase.name);

  constructor(
    @Inject(XP_REPOSITORY) private readonly repo: XpRepository,
    @Inject(STRIPE_COUPON_SERVICE)
    private readonly coupons: StripeCouponService,
  ) {}

  /**
   * For each candidate reward key, ensure an UnlockedReward row exists.
   * For stripe_coupon rewards, also create the Stripe coupon + promotion code.
   * Returns the rewards that were ACTUALLY newly unlocked (not pre-existing).
   */
  async execute(input: {
    email: string;
    rewardKeys: RewardKey[];
    atLevel: number;
  }): Promise<RewardKey[]> {
    const newlyUnlocked: RewardKey[] = [];

    for (const key of input.rewardKeys) {
      const def = REWARDS[key];
      if (!def) {
        this.logger.warn(`Unknown reward key: ${key}`);
        continue;
      }

      try {
        let stripeCouponId: string | null = null;
        let stripePromotionCode: string | null = null;

        if (def.type === 'stripe_coupon') {
          // Create the Stripe coupon BEFORE inserting the row, so we don't have
          // a row pointing to a missing coupon if Stripe fails.
          // Note: for race conditions where the row already exists, we'll waste a
          // coupon. Acceptable trade-off given how rare this is.
          const peek = await this.repo.upsertReward({
            email: input.email,
            rewardKey: key,
            unlockedAtLevel: input.atLevel,
            stripeCouponId: null,
            stripePromotionCode: null,
          });
          if (!peek.inserted) {
            // Already unlocked previously, skip
            continue;
          }
          // Create Stripe coupon and PATCH the row with IDs
          const coupon = await this.coupons.createPersonalCoupon({
            email: input.email,
            rewardKey: key,
            percentOff: def.couponPercent,
            duration: def.couponDuration,
            durationInMonths: def.couponMonths,
          });
          stripeCouponId = coupon.couponId;
          stripePromotionCode = coupon.promotionCode;
          // Update the row with coupon IDs (re-upsert is safe)
          await this.repo.upsertReward({
            email: input.email,
            rewardKey: key,
            unlockedAtLevel: input.atLevel,
            stripeCouponId,
            stripePromotionCode,
          });
          newlyUnlocked.push(key);
        } else {
          // Cosmetic reward — just upsert the row
          const result = await this.repo.upsertReward({
            email: input.email,
            rewardKey: key,
            unlockedAtLevel: input.atLevel,
          });
          if (result.inserted) newlyUnlocked.push(key);
        }
      } catch (err) {
        // Log and continue — we don't want a Stripe failure to block the level-up
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to grant reward ${key} to ${input.email}: ${message}`,
        );
      }
    }

    return newlyUnlocked;
  }
}
