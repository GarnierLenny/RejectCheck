import {
  isActive,
  isHiredAndActive,
  type Subscription,
} from './subscription.types';

const HOUR = 60 * 60 * 1000;

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    email: 'a@b.com',
    provider: 'stripe',
    stripeCustomerId: 'cus_1',
    externalRef: null,
    plan: 'shortlisted',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + HOUR),
    ...overrides,
  };
}

describe('isActive', () => {
  it('is false for a null subscription', () => {
    expect(isActive(null)).toBe(false);
  });

  it('is true for an active sub whose period has not ended', () => {
    expect(isActive(sub({}))).toBe(true);
  });

  it('is false once the current period has elapsed (the renewal-sync bug)', () => {
    expect(
      isActive(sub({ currentPeriodEnd: new Date(Date.now() - HOUR) })),
    ).toBe(false);
  });

  it('is false for a canceled sub even within the period', () => {
    expect(isActive(sub({ status: 'canceled' }))).toBe(false);
  });

  it('is false for a past_due sub', () => {
    expect(isActive(sub({ status: 'past_due' }))).toBe(false);
  });
});

describe('isHiredAndActive', () => {
  it('is true only for an active hired sub', () => {
    expect(isHiredAndActive(sub({ plan: 'hired' }))).toBe(true);
  });

  it('is false for an active shortlisted sub', () => {
    expect(isHiredAndActive(sub({ plan: 'shortlisted' }))).toBe(false);
  });

  it('is false for an expired hired sub', () => {
    expect(
      isHiredAndActive(
        sub({ plan: 'hired', currentPeriodEnd: new Date(Date.now() - HOUR) }),
      ),
    ).toBe(false);
  });
});
