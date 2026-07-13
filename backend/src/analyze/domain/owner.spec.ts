import { isOwnerEmail } from './owner';

describe('isOwnerEmail', () => {
  const csv = 'Lenny@Example.com, admin@rejectcheck.com';

  it('matches case-insensitively and trims whitespace', () => {
    expect(isOwnerEmail('lenny@example.com', csv)).toBe(true);
    expect(isOwnerEmail('  ADMIN@rejectcheck.com ', csv)).toBe(true);
  });

  it('rejects non-owners', () => {
    expect(isOwnerEmail('stranger@gmail.com', csv)).toBe(false);
  });

  it('is false when email or csv is missing/empty', () => {
    expect(isOwnerEmail(undefined, csv)).toBe(false);
    expect(isOwnerEmail('lenny@example.com', undefined)).toBe(false);
    expect(isOwnerEmail('lenny@example.com', '')).toBe(false);
    expect(isOwnerEmail('', csv)).toBe(false);
  });

  it('handles a single-entry csv and stray commas', () => {
    expect(isOwnerEmail('a@b.com', 'a@b.com')).toBe(true);
    expect(isOwnerEmail('a@b.com', ' , a@b.com , ')).toBe(true);
  });
});
