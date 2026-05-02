import { Inject, Injectable, Logger } from '@nestjs/common';
import { STRIPE_CLIENT } from '../../stripe/ports/tokens';
import type { StripeClient } from '../../stripe/ports/stripe-client';
import type {
  CreatedCoupon,
  StripeCouponService,
} from '../ports/stripe-coupon.service';

@Injectable()
export class StripeCouponServiceImpl implements StripeCouponService {
  private readonly logger = new Logger(StripeCouponServiceImpl.name);

  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: StripeClient) {}

  async createPersonalCoupon(input: {
    email: string;
    rewardKey: string;
    percentOff: number;
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
  }): Promise<CreatedCoupon> {
    // Generate a short, human-readable code: RC-XXXXXX (uppercase alphanumeric)
    const code = `RC-${randomCode(6)}`;

    const coupon = await this.stripe.coupons.create({
      percent_off: input.percentOff,
      duration: input.duration,
      duration_in_months:
        input.duration === 'repeating' ? input.durationInMonths : undefined,
      max_redemptions: 1,
      metadata: {
        email: input.email,
        rewardKey: input.rewardKey,
        source: 'xp_tier_unlock',
      },
    });

    // The Stripe SDK's PromotionCodeCreateParams in this version expects `promotion`
    // (legacy alias for the coupon field). Cast through unknown to bypass.
    const promotion = await this.stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1,
      metadata: {
        email: input.email,
        rewardKey: input.rewardKey,
      },
    } as unknown as Parameters<typeof this.stripe.promotionCodes.create>[0]);

    this.logger.log(
      `Created Stripe coupon for ${input.email} reward=${input.rewardKey} code=${promotion.code}`,
    );

    return {
      couponId: coupon.id,
      promotionCode: promotion.code,
    };
  }
}

function randomCode(len: number): string {
  // Avoid ambiguous chars (0/O, 1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
