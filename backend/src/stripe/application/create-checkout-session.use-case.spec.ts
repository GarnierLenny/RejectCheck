import { ConfigService } from '@nestjs/config';
import { CreateCheckoutSessionUseCase } from './create-checkout-session.use-case';
import { FOUNDER_SEAT_CAP } from '../domain/founder';
import type { StripeClient } from '../ports/stripe-client';

const PRICE_SHORTLISTED = 'price_short';
const PRICE_HIRED = 'price_hired';
const PRICE_FOUNDER = 'price_founder';

function makeConfig(overrides: Record<string, string | undefined> = {}) {
  const map: Record<string, string | undefined> = {
    STRIPE_SHORTLISTED_PRICE_ID: PRICE_SHORTLISTED,
    STRIPE_HIRED_PRICE_ID: PRICE_HIRED,
    STRIPE_FOUNDER_PRICE_ID: PRICE_FOUNDER,
    FRONTEND_URL: 'https://app.test',
    ...overrides,
  };
  return { get: (k: string) => map[k] } as unknown as ConfigService;
}

/** StripeClient stub whose subscriptions.list yields `seatCount` active subs. */
function makeStripe(seatCount = 0) {
  const create = jest
    .fn()
    .mockResolvedValue({ url: 'https://checkout.test/session' });
  const list = jest.fn().mockReturnValue({
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < seatCount; i++) yield { status: 'active' };
    },
  });
  const stripe = {
    checkout: { sessions: { create } },
    subscriptions: { list },
  } as unknown as StripeClient;
  return { stripe, create, list };
}

describe('CreateCheckoutSessionUseCase', () => {
  it('checks out the hired plan on its own price', async () => {
    const { stripe, create, list } = makeStripe();
    const uc = new CreateCheckoutSessionUseCase(stripe, makeConfig());

    const res = await uc.execute({ plan: 'hired', customerEmail: 'a@b.c' });

    expect(res.url).toBe('https://checkout.test/session');
    expect(list).not.toHaveBeenCalled(); // no seat count for non-founder plans
    const arg = create.mock.calls[0][0];
    expect(arg.line_items[0].price).toBe(PRICE_HIRED);
    expect(arg.metadata).toEqual({ plan: 'hired', email: 'a@b.c' });
  });

  it('checks out founder on the discounted price but persists plan=hired', async () => {
    const { stripe, create } = makeStripe(10);
    const uc = new CreateCheckoutSessionUseCase(stripe, makeConfig());

    const res = await uc.execute({ plan: 'founder', customerEmail: 'a@b.c' });

    expect(res.url).toBe('https://checkout.test/session');
    const arg = create.mock.calls[0][0];
    expect(arg.line_items[0].price).toBe(PRICE_FOUNDER);
    // metadata.plan must stay a valid SubscriptionPlan (the completed handler
    // rejects anything else) — founder origin is flagged separately.
    expect(arg.metadata).toEqual({
      plan: 'hired',
      email: 'a@b.c',
      founder: 'true',
    });
  });

  it('reports sold out (no checkout) once the founder cap is reached', async () => {
    const { stripe, create } = makeStripe(FOUNDER_SEAT_CAP);
    const uc = new CreateCheckoutSessionUseCase(stripe, makeConfig());

    const res = await uc.execute({ plan: 'founder' });

    expect(res).toEqual({ url: null, soldOut: true });
    expect(create).not.toHaveBeenCalled();
  });

  it('reports sold out when the founder price is not configured', async () => {
    const { stripe, create, list } = makeStripe();
    const uc = new CreateCheckoutSessionUseCase(
      stripe,
      makeConfig({ STRIPE_FOUNDER_PRICE_ID: undefined }),
    );

    const res = await uc.execute({ plan: 'founder' });

    expect(res).toEqual({ url: null, soldOut: true });
    expect(list).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
