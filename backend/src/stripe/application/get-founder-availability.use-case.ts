import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';
import { FOUNDER_SEAT_CAP, countActiveFounderSeats } from '../domain/founder';

export type FounderAvailability = {
  /** false when the deal isn't configured (no price id) — hide the offer. */
  enabled: boolean;
  taken: number;
  cap: number;
  remaining: number;
  soldOut: boolean;
};

/**
 * Reports how many capped founder seats remain, for the public pricing page.
 * Result is cached briefly so a burst of pricing-page loads doesn't hammer the
 * Stripe API — the counter doesn't need to be real-time, and the checkout
 * use-case re-checks the cap authoritatively before creating a session.
 */
@Injectable()
export class GetFounderAvailabilityUseCase {
  private static readonly TTL_MS = 60_000;
  private cache?: { value: FounderAvailability; at: number };

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    private readonly config: ConfigService,
  ) {}

  async execute(): Promise<FounderAvailability> {
    const priceId = this.config.get<string>('STRIPE_FOUNDER_PRICE_ID');
    if (!priceId) {
      return {
        enabled: false,
        taken: 0,
        cap: FOUNDER_SEAT_CAP,
        remaining: 0,
        soldOut: true,
      };
    }

    const now = Date.now();
    if (this.cache && now - this.cache.at < GetFounderAvailabilityUseCase.TTL_MS) {
      return this.cache.value;
    }

    const taken = await countActiveFounderSeats(this.stripe, priceId);
    const remaining = Math.max(0, FOUNDER_SEAT_CAP - taken);
    const value: FounderAvailability = {
      enabled: true,
      taken,
      cap: FOUNDER_SEAT_CAP,
      remaining,
      soldOut: remaining === 0,
    };
    this.cache = { value, at: now };
    return value;
  }
}
