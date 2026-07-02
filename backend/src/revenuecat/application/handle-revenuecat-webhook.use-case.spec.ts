import { HandleRevenueCatWebhookUseCase } from './handle-revenuecat-webhook.use-case';
import type { RevenueCatWebhookVerifier } from '../ports/webhook-verifier';
import type { SubscriptionRepository } from '../../stripe/ports/subscription.repository';

const expiration = Date.parse('2026-08-01T00:00:00Z');

function makeUseCase() {
  const verifier = { verify: jest.fn() } as unknown as RevenueCatWebhookVerifier;
  const repo = {
    upsert: jest.fn().mockResolvedValue(undefined),
    cancelByEmailAndProvider: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SubscriptionRepository>;
  return {
    uc: new HandleRevenueCatWebhookUseCase(verifier, repo),
    repo,
    verifier,
  };
}

function event(overrides: Record<string, unknown>) {
  return {
    event: {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'user@example.com',
      entitlement_ids: ['hired'],
      expiration_at_ms: expiration,
      ...overrides,
    },
  };
}

describe('HandleRevenueCatWebhookUseCase', () => {
  it('verifies auth before touching the body', async () => {
    const { uc, verifier } = makeUseCase();
    await uc.execute('Bearer secret', event({}));
    expect(verifier.verify).toHaveBeenCalledWith('Bearer secret');
  });

  it('activates a hired entitlement on INITIAL_PURCHASE', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({}));
    expect(repo.upsert).toHaveBeenCalledWith({
      email: 'user@example.com',
      provider: 'revenuecat',
      stripeCustomerId: null,
      externalRef: 'user@example.com',
      plan: 'hired',
      status: 'active',
      currentPeriodEnd: new Date(expiration),
    });
  });

  it('activates on RENEWAL (mobile renewals stay in sync, unlike the old Stripe gap)', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({ type: 'RENEWAL', entitlement_ids: ['shortlisted'] }));
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'shortlisted', status: 'active' }),
    );
  });

  it('revokes on EXPIRATION, scoped to the revenuecat provider', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({ type: 'EXPIRATION' }));
    expect(repo.cancelByEmailAndProvider).toHaveBeenCalledWith(
      'user@example.com',
      'revenuecat',
    );
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('ignores CANCELLATION (access continues until expiration)', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({ type: 'CANCELLATION' }));
    expect(repo.upsert).not.toHaveBeenCalled();
    expect(repo.cancelByEmailAndProvider).not.toHaveBeenCalled();
  });

  it('skips activation when app_user_id is not an email', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({ app_user_id: 'not-an-email' }));
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('skips activation when the entitlement does not map to a plan', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({ entitlement_ids: ['premium'] }));
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('skips activation when expiration is missing', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute('auth', event({ expiration_at_ms: null }));
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
