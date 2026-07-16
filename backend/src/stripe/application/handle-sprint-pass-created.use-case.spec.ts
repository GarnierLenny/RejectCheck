import { HandleSprintPassCreatedUseCase } from './handle-sprint-pass-created.use-case';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import { SPRINT_PASS_DURATION_MS } from '../domain/sprint-pass';

const created = Math.floor(Date.parse('2026-07-16T00:00:00Z') / 1000);
const expectedExpiry = new Date(created * 1000 + SPRINT_PASS_DURATION_MS);

function makeUseCase() {
  const repo = {
    upsert: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SubscriptionRepository>;
  const analytics = { capture: jest.fn() };
  return { uc: new HandleSprintPassCreatedUseCase(repo, analytics), repo, analytics };
}

const validSession = {
  mode: 'payment',
  payment_status: 'paid',
  created,
  customer_details: { email: 'buyer@example.com' },
  customer: 'cus_1',
  metadata: { type: 'sprint_pass', email: 'buyer@example.com' },
};

describe('HandleSprintPassCreatedUseCase', () => {
  it('grants a time-boxed hired entitlement under provider stripe_sprint', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute(validSession);
    expect(repo.upsert).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      provider: 'stripe_sprint',
      stripeCustomerId: 'cus_1',
      externalRef: null,
      plan: 'hired',
      status: 'active',
      currentPeriodEnd: expectedExpiry,
    });
  });

  it('emits a server-side sprint_pass_purchased conversion event', async () => {
    const { uc, analytics } = makeUseCase();
    await uc.execute(validSession);
    expect(analytics.capture).toHaveBeenCalledWith({
      event: 'sprint_pass_purchased',
      distinctId: 'buyer@example.com',
      properties: { expiresAt: expectedExpiry.toISOString() },
    });
  });

  it('derives the expiry from the session created time (not now), so replays are idempotent', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute(validSession);
    await uc.execute(validSession); // Stripe retry / CLI resend of the same event
    const [first] = repo.upsert.mock.calls[0];
    const [second] = repo.upsert.mock.calls[1];
    expect(first.currentPeriodEnd).toEqual(expectedExpiry);
    expect(second.currentPeriodEnd).toEqual(first.currentPeriodEnd);
  });

  it('trusts customer_details.email over a user-controlled metadata.email', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({
      ...validSession,
      metadata: { type: 'sprint_pass', email: 'attacker@evil.com' },
    });
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'buyer@example.com' }),
    );
  });

  it('does not grant on a non-paid session (async payment methods)', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ ...validSession, payment_status: 'unpaid' });
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('does not grant when the Stripe-verified email is missing', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ ...validSession, customer_details: { email: null } });
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
