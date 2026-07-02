import { ConfigService } from '@nestjs/config';
import { HandleSubscriptionUpdatedUseCase } from './handle-subscription-updated.use-case';
import type { SubscriptionRepository } from '../ports/subscription.repository';

const PRICE_SHORTLISTED = 'price_short';
const PRICE_HIRED = 'price_hired';

function makeUseCase() {
  const repo = {
    refreshByCustomerId: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SubscriptionRepository>;

  const config = {
    get: (key: string) =>
      key === 'STRIPE_SHORTLISTED_PRICE_ID'
        ? PRICE_SHORTLISTED
        : key === 'STRIPE_HIRED_PRICE_ID'
          ? PRICE_HIRED
          : undefined,
  } as unknown as ConfigService;

  return {
    uc: new HandleSubscriptionUpdatedUseCase(repo, config),
    repo,
  };
}

// A renewal one month out.
const periodEnd = Math.floor(Date.parse('2026-08-01T00:00:00Z') / 1000);

describe('HandleSubscriptionUpdatedUseCase', () => {
  it('syncs currentPeriodEnd on renewal — the core fix for silent lapse', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      customer: 'cus_1',
      status: 'active',
      current_period_end: periodEnd,
      items: { data: [{ price: { id: PRICE_HIRED } }] },
    });
    expect(repo.refreshByCustomerId).toHaveBeenCalledWith('cus_1', {
      status: 'active',
      currentPeriodEnd: new Date(periodEnd * 1000),
      plan: 'hired',
    });
  });

  it('reads current_period_end from items when absent at the root (newer API)', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      customer: { id: 'cus_2' },
      status: 'active',
      items: { data: [{ current_period_end: periodEnd, price: { id: PRICE_SHORTLISTED } }] },
    });
    expect(repo.refreshByCustomerId).toHaveBeenCalledWith('cus_2', {
      status: 'active',
      currentPeriodEnd: new Date(periodEnd * 1000),
      plan: 'shortlisted',
    });
  });

  it('preserves the stored plan when the price is unknown (legacy/grandfathered)', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      customer: 'cus_3',
      status: 'active',
      current_period_end: periodEnd,
      items: { data: [{ price: { id: 'price_legacy_799' } }] },
    });
    expect(repo.refreshByCustomerId).toHaveBeenCalledWith('cus_3', {
      status: 'active',
      currentPeriodEnd: new Date(periodEnd * 1000),
      plan: undefined,
    });
  });

  it('reflects a past_due status so access is suspended until payment', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      customer: 'cus_4',
      status: 'past_due',
      current_period_end: periodEnd,
      items: { data: [{ price: { id: PRICE_HIRED } }] },
    });
    expect(repo.refreshByCustomerId).toHaveBeenCalledWith(
      'cus_4',
      expect.objectContaining({ status: 'past_due' }),
    );
  });

  it('is a no-op on a malformed payload (missing customer)', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ status: 'active', current_period_end: periodEnd });
    expect(repo.refreshByCustomerId).not.toHaveBeenCalled();
  });

  it('is a no-op when no period end can be resolved', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      customer: 'cus_5',
      status: 'active',
      items: { data: [{ price: { id: PRICE_HIRED } }] },
    });
    expect(repo.refreshByCustomerId).not.toHaveBeenCalled();
  });
});
