import {
  entitlementToPlan,
  ACTIVATING_EVENTS,
  REVOKING_EVENTS,
} from './revenuecat-event.types';

describe('entitlementToPlan', () => {
  it('maps hired', () => {
    expect(entitlementToPlan(['hired'])).toBe('hired');
  });

  it('maps shortlisted', () => {
    expect(entitlementToPlan(['shortlisted'])).toBe('shortlisted');
  });

  it('prefers hired when both are present', () => {
    expect(entitlementToPlan(['shortlisted', 'hired'])).toBe('hired');
  });

  it('returns null for unmapped or empty entitlements', () => {
    expect(entitlementToPlan([])).toBeNull();
    expect(entitlementToPlan(['premium'])).toBeNull();
  });
});

describe('event classification', () => {
  it('treats renewals and (un)cancellations as activating', () => {
    for (const t of [
      'INITIAL_PURCHASE',
      'RENEWAL',
      'PRODUCT_CHANGE',
      'UNCANCELLATION',
      'NON_RENEWING_PURCHASE',
    ]) {
      expect(ACTIVATING_EVENTS.has(t)).toBe(true);
    }
  });

  it('revokes only on EXPIRATION — CANCELLATION keeps access until it expires', () => {
    expect(REVOKING_EVENTS.has('EXPIRATION')).toBe(true);
    expect(REVOKING_EVENTS.has('CANCELLATION')).toBe(false);
    expect(ACTIVATING_EVENTS.has('CANCELLATION')).toBe(false);
  });
});
