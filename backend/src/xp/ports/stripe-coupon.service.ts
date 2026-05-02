export type CreatedCoupon = {
  couponId: string;
  promotionCode: string; // human-readable e.g. "RC-A1B2C3"
};

export interface StripeCouponService {
  /**
   * Create a single-use coupon attached to a unique promotion code.
   * Returns the IDs to persist for redemption tracking.
   */
  createPersonalCoupon(input: {
    email: string;
    rewardKey: string;
    percentOff: number; // 1..100
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number; // required if duration === 'repeating'
  }): Promise<CreatedCoupon>;
}
