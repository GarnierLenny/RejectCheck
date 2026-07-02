import { HandleCheckoutCompletedUseCase } from './handle-checkout-completed.use-case';
import type { StripeClient } from '../ports/stripe-client';
import type { SubscriptionRepository } from '../ports/subscription.repository';

const periodEnd = Math.floor(Date.parse('2026-08-01T00:00:00Z') / 1000);

function makeUseCase(subStatus = 'active') {
  const retrieve = jest
    .fn()
    .mockResolvedValue({ status: subStatus, current_period_end: periodEnd });
  const stripe = {
    subscriptions: { retrieve },
  } as unknown as StripeClient;

  const repo = {
    upsert: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SubscriptionRepository>;

  return { uc: new HandleCheckoutCompletedUseCase(stripe, repo), repo, retrieve };
}

const validSession = {
  mode: 'subscription',
  customer_details: { email: 'buyer@example.com' },
  customer: 'cus_1',
  subscription: 'sub_1',
  metadata: { plan: 'hired' },
};

describe('HandleCheckoutCompletedUseCase', () => {
  it('persists the subscription using the Stripe-verified email and retrieved period', async () => {
    const { uc, repo, retrieve } = makeUseCase();
    await uc.execute(validSession);
    expect(retrieve).toHaveBeenCalledWith('sub_1');
    expect(repo.upsert).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      provider: 'stripe',
      stripeCustomerId: 'cus_1',
      plan: 'hired',
      status: 'active',
      currentPeriodEnd: new Date(periodEnd * 1000),
    });
  });

  it('ignores a user-controlled metadata.email, trusting customer_details only', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      ...validSession,
      metadata: { plan: 'shortlisted', email: 'attacker@evil.com' },
    });
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'buyer@example.com', plan: 'shortlisted' }),
    );
  });

  it('does not persist when the plan is invalid', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ ...validSession, metadata: { plan: 'enterprise' } });
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('does not persist when the customer email is missing', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ ...validSession, customer_details: { email: null } });
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('does not persist when the subscription id is missing', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ ...validSession, subscription: null });
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
