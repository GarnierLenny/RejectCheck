import {
  decideQuota,
  startOfMonthUTC,
  MONTHLY_CAPS,
  CREDIT_COSTS,
  ANONYMOUS_LIFETIME_CAP,
  type QuotaContext,
} from './quota.policy';

const base: QuotaContext = {
  plan: 'free',
  monthlyUsed: 0,
  countByIpLifetime: 0,
  creditsBalance: 0,
  actionCost: CREDIT_COSTS.analyze,
};

describe('decideQuota', () => {
  describe('anonymous (no email)', () => {
    it('allows the first analysis, drawing from the anonymous bucket', () => {
      const d = decideQuota({ ...base, ip: '1.2.3.4', countByIpLifetime: 0 });
      expect(d).toEqual({ allowed: true, consume: 'anonymous' });
    });

    it('denies once the lifetime IP cap is reached', () => {
      const d = decideQuota({
        ...base,
        ip: '1.2.3.4',
        countByIpLifetime: ANONYMOUS_LIFETIME_CAP,
      });
      expect(d).toEqual({
        allowed: false,
        reason: 'limit_reached',
        plan: 'free',
        monthlyCap: ANONYMOUS_LIFETIME_CAP,
      });
    });
  });

  describe('registered users', () => {
    it('draws from the monthly allowance while under the cap', () => {
      const d = decideQuota({
        ...base,
        email: 'a@b.com',
        plan: 'shortlisted',
        monthlyUsed: MONTHLY_CAPS.shortlisted - CREDIT_COSTS.analyze,
      });
      expect(d).toEqual({ allowed: true, consume: 'monthly' });
    });

    it('falls back to credits once the monthly cap is hit', () => {
      const d = decideQuota({
        ...base,
        email: 'a@b.com',
        plan: 'free',
        monthlyUsed: MONTHLY_CAPS.free,
        creditsBalance: CREDIT_COSTS.analyze,
      });
      expect(d).toEqual({ allowed: true, consume: 'credit' });
    });

    it('denies at the cap when the credit balance is insufficient', () => {
      const d = decideQuota({
        ...base,
        email: 'a@b.com',
        plan: 'free',
        monthlyUsed: MONTHLY_CAPS.free,
        creditsBalance: CREDIT_COSTS.analyze - 1,
      });
      expect(d).toEqual({
        allowed: false,
        reason: 'limit_reached',
        plan: 'free',
        monthlyCap: MONTHLY_CAPS.free,
      });
    });

    it('applies the hired cap for hired users', () => {
      const underCap = decideQuota({
        ...base,
        email: 'a@b.com',
        plan: 'hired',
        monthlyUsed: MONTHLY_CAPS.hired - 1,
      });
      expect(underCap).toEqual({ allowed: true, consume: 'monthly' });
    });

    it('honours the review action cost for the credit fallback', () => {
      const d = decideQuota({
        ...base,
        email: 'a@b.com',
        plan: 'free',
        monthlyUsed: MONTHLY_CAPS.free,
        actionCost: CREDIT_COSTS.review,
        creditsBalance: CREDIT_COSTS.review,
      });
      expect(d).toEqual({ allowed: true, consume: 'credit' });
    });
  });
});

describe('startOfMonthUTC', () => {
  it('returns the first instant of the month in UTC', () => {
    const d = startOfMonthUTC(new Date('2026-07-17T13:45:00Z'));
    expect(d.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});
