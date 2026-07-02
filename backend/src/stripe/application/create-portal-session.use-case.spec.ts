import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePortalSessionUseCase } from './create-portal-session.use-case';
import type { StripeClient } from '../ports/stripe-client';
import type { SubscriptionRepository } from '../ports/subscription.repository';

function makeUseCase(customerId: string | null) {
  const create = jest
    .fn()
    .mockResolvedValue({ url: 'https://billing.stripe.com/session/xyz' });
  const stripe = {
    billingPortal: { sessions: { create } },
  } as unknown as StripeClient;

  const repo = {
    findStripeCustomerIdByEmail: jest.fn().mockResolvedValue(customerId),
  } as unknown as jest.Mocked<SubscriptionRepository>;

  const config = {
    get: (k: string) => (k === 'FRONTEND_URL' ? 'https://rejectcheck.com' : undefined),
  } as unknown as ConfigService;

  return { uc: new CreatePortalSessionUseCase(stripe, repo, config), create };
}

describe('CreatePortalSessionUseCase', () => {
  it('opens a portal session for the resolved Stripe customer', async () => {
    const { uc, create } = makeUseCase('cus_1');
    const res = await uc.execute({ email: 'a@b.com', returnUrl: 'https://x/y' });
    expect(create).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'https://x/y',
    });
    expect(res).toEqual({ url: 'https://billing.stripe.com/session/xyz' });
  });

  it('defaults the return_url to the dashboard when none is given', async () => {
    const { uc, create } = makeUseCase('cus_1');
    await uc.execute({ email: 'a@b.com' });
    expect(create).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'https://rejectcheck.com/dashboard',
    });
  });

  it('throws NotFound when the user has no Stripe customer (e.g. mobile-only)', async () => {
    const { uc } = makeUseCase(null);
    await expect(uc.execute({ email: 'a@b.com' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
