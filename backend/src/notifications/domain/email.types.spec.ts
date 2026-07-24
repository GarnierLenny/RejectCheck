import {
  defaultDedupeKey,
  emailCategoryOf,
  type EmailJobPayload,
} from './email.types';

describe('emailCategoryOf', () => {
  it('treats unsolicited nudges as marketing so they honour an unsubscribe', () => {
    expect(emailCategoryOf('application_stale')).toBe('marketing');
    expect(emailCategoryOf('drip_d1')).toBe('marketing');
    expect(emailCategoryOf('drip_d3')).toBe('marketing');
  });

  it('keeps contract email transactional', () => {
    expect(emailCategoryOf('welcome')).toBe('transactional');
    expect(emailCategoryOf('analysis_ready')).toBe('transactional');
  });
});

describe('defaultDedupeKey', () => {
  const base = { to: 'a@b.com', locale: 'en' as const };

  it('keys the stale nudge per APPLICATION, not per user', () => {
    // The cron re-selects the same rows every hour (they stay stale until the
    // user acts), so this key is the only thing between one nudge and one an
    // hour. Two different applications must still both be able to send.
    const one: EmailJobPayload = {
      ...base,
      context: {
        type: 'application_stale',
        applicationId: 1,
        jobTitle: 'X',
        company: 'Y',
        daysSince: 14,
      },
    };
    const two: EmailJobPayload = {
      ...base,
      context: { ...one.context, applicationId: 2 } as EmailJobPayload['context'],
    };

    expect(defaultDedupeKey(one)).toBe('application_stale:a@b.com:1');
    expect(defaultDedupeKey(two)).toBe('application_stale:a@b.com:2');
    expect(defaultDedupeKey(one)).not.toBe(defaultDedupeKey(two));
  });

  it('is stable across re-runs for the same application', () => {
    const p: EmailJobPayload = {
      ...base,
      context: {
        type: 'application_stale',
        applicationId: 7,
        jobTitle: 'X',
        company: 'Y',
        // The day count grows on every run; the key must NOT follow it, or the
        // user gets a fresh email each day the silence continues.
        daysSince: 14,
      },
    };
    const later: EmailJobPayload = {
      ...p,
      context: { ...p.context, daysSince: 30 } as EmailJobPayload['context'],
    };
    expect(defaultDedupeKey(later)).toBe(defaultDedupeKey(p));
  });

  it('leaves the existing keys untouched', () => {
    expect(defaultDedupeKey({ ...base, context: { type: 'drip_d1' } })).toBe(
      'drip_d1:a@b.com',
    );
    expect(
      defaultDedupeKey({
        ...base,
        context: { type: 'analysis_ready', analysisId: 9 },
      }),
    ).toBe('analysis_ready:a@b.com:9');
  });
});
