import {
  STALE_AFTER_DAYS,
  STALE_UNTIL_DAYS,
  daysSinceApplied,
  isNudgeable,
  selectNudgeable,
  type StaleCandidate,
} from './stale-applications';

const NOW = new Date('2026-07-24T12:00:00.000Z');

/** An application applied exactly `days` before NOW. */
function app(days: number, over: Partial<StaleCandidate> = {}): StaleCandidate {
  return {
    id: 1,
    email: 'a@b.com',
    jobTitle: 'Full-Stack Engineer',
    company: 'Acme',
    status: 'applied',
    appliedAt: new Date(NOW.getTime() - days * 86_400_000),
    ...over,
  };
}

describe('daysSinceApplied', () => {
  it('counts whole days', () => {
    expect(daysSinceApplied(new Date(NOW.getTime() - 14 * 86_400_000), NOW)).toBe(14);
    // 13 days and 23 hours is not yet 14.
    expect(
      daysSinceApplied(new Date(NOW.getTime() - (14 * 86_400_000 - 3_600_000)), NOW),
    ).toBe(13);
  });

  it('clamps a future date to 0 rather than going negative', () => {
    expect(daysSinceApplied(new Date(NOW.getTime() + 86_400_000), NOW)).toBe(0);
  });
});

describe('isNudgeable', () => {
  it('fires exactly at the threshold, not before', () => {
    expect(isNudgeable(app(STALE_AFTER_DAYS - 1), NOW)).toBe(false);
    expect(isNudgeable(app(STALE_AFTER_DAYS), NOW)).toBe(true);
  });

  it('stops once the application is archaeology', () => {
    expect(isNudgeable(app(STALE_UNTIL_DAYS), NOW)).toBe(true);
    expect(isNudgeable(app(STALE_UNTIL_DAYS + 1), NOW)).toBe(false);
  });

  it('never nudges a status that has already moved on', () => {
    // The one that would really hurt: reminding someone about a role that
    // already rejected them, or that they never actually applied to.
    for (const status of ['interested', 'interviewing', 'offer', 'rejected']) {
      expect(isNudgeable(app(20, { status }), NOW)).toBe(false);
    }
    expect(isNudgeable(app(20, { status: 'applied' }), NOW)).toBe(true);
  });
});

describe('selectNudgeable', () => {
  it('keeps only the eligible ones, quietest first', () => {
    const rows = [
      app(20, { id: 1 }),
      app(3, { id: 2 }), // too recent
      app(40, { id: 3 }),
      app(60, { id: 4 }), // too old
      app(30, { id: 5, status: 'rejected' }), // wrong status
    ];
    expect(selectNudgeable(rows, NOW).map((a) => a.id)).toEqual([3, 1]);
  });

  it('returns nothing when there is nothing to say', () => {
    expect(selectNudgeable([], NOW)).toEqual([]);
    expect(selectNudgeable([app(1), app(2)], NOW)).toEqual([]);
  });
});
