import { ConfigService } from '@nestjs/config';
import { GetFounderAvailabilityUseCase } from './get-founder-availability.use-case';
import { FOUNDER_SEAT_CAP } from '../domain/founder';
import type { StripeClient } from '../ports/stripe-client';

const PRICE_FOUNDER = 'price_founder';

function makeConfig(priceId: string = PRICE_FOUNDER) {
  return {
    get: (k: string) => (k === 'STRIPE_FOUNDER_PRICE_ID' ? priceId : undefined),
  } as unknown as ConfigService;
}

/** Config where STRIPE_FOUNDER_PRICE_ID is unset (deal not configured). */
const disabledConfig = { get: () => undefined } as unknown as ConfigService;

function makeStripe(seatCount = 0) {
  const list = jest.fn().mockReturnValue({
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < seatCount; i++) yield { status: 'active' };
    },
  });
  const stripe = { subscriptions: { list } } as unknown as StripeClient;
  return { stripe, list };
}

describe('GetFounderAvailabilityUseCase', () => {
  it('is disabled (and never calls Stripe) when the price is not configured', async () => {
    const { stripe, list } = makeStripe();
    const uc = new GetFounderAvailabilityUseCase(stripe, disabledConfig);

    const res = await uc.execute();

    expect(res.enabled).toBe(false);
    expect(res.soldOut).toBe(true);
    expect(list).not.toHaveBeenCalled();
  });

  it('reports remaining seats against the cap', async () => {
    // Derived from the cap, not a literal: a hardcoded count silently turns
    // this "partially filled" case into a sold-out one the day the cap drops.
    const taken = Math.floor(FOUNDER_SEAT_CAP / 2);
    const { stripe } = makeStripe(taken);
    const uc = new GetFounderAvailabilityUseCase(stripe, makeConfig());

    const res = await uc.execute();

    expect(res).toEqual({
      enabled: true,
      taken,
      cap: FOUNDER_SEAT_CAP,
      remaining: FOUNDER_SEAT_CAP - taken,
      soldOut: false,
    });
  });

  it('is sold out at the cap', async () => {
    const { stripe } = makeStripe(FOUNDER_SEAT_CAP);
    const uc = new GetFounderAvailabilityUseCase(stripe, makeConfig());

    const res = await uc.execute();

    expect(res.remaining).toBe(0);
    expect(res.soldOut).toBe(true);
  });

  it('caches the count so a burst of loads hits Stripe once', async () => {
    const { stripe, list } = makeStripe(5);
    const uc = new GetFounderAvailabilityUseCase(stripe, makeConfig());

    await uc.execute();
    await uc.execute();

    expect(list).toHaveBeenCalledTimes(1);
  });
});
