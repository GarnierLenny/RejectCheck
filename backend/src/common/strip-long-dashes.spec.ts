import { deepStripLongDashes, stripLongDashes } from './strip-long-dashes';

describe('stripLongDashes', () => {
  it('replaces a spaced em dash with a comma', () => {
    expect(stripLongDashes('Be honest — not encouraging.')).toBe(
      'Be honest, not encouraging.',
    );
  });

  it('replaces an unspaced em dash with a comma and a space', () => {
    expect(stripLongDashes('Exceptional CV—strong impact.')).toBe(
      'Exceptional CV, strong impact.',
    );
  });

  it('replaces en dashes and horizontal bars too', () => {
    expect(stripLongDashes('reads below – your titles')).toBe(
      'reads below, your titles',
    );
    expect(stripLongDashes('a ― b')).toBe('a, b');
  });

  it('keeps numeric ranges readable as a hyphen', () => {
    expect(stripLongDashes('€55,000–75,000/year')).toBe('€55,000-75,000/year');
    expect(stripLongDashes('400 – 650/day')).toBe('400-650/day');
  });

  it('does not touch ASCII hyphens, ids, or URLs', () => {
    expect(stripLongDashes('cv-1a2b3c4d')).toBe('cv-1a2b3c4d');
    expect(stripLongDashes('https://example.com/a-b-c')).toBe(
      'https://example.com/a-b-c',
    );
    expect(stripLongDashes('well-rounded, self-starter')).toBe(
      'well-rounded, self-starter',
    );
  });

  it('does not merge lines / list items across a newline', () => {
    expect(stripLongDashes('line one —\nline two')).toBe(
      'line one, \nline two',
    );
  });

  it('strips the section sign and its trailing space', () => {
    expect(stripLongDashes('§ 01 · Where to start')).toBe(
      '01 · Where to start',
    );
    expect(stripLongDashes('see §09 for details')).toBe('see 09 for details');
  });

  it('strips the section sign even when there is no long dash', () => {
    expect(stripLongDashes('§ Last step')).toBe('Last step');
  });

  it('returns identical string when there is nothing to strip', () => {
    const s = 'no long dashes here';
    expect(stripLongDashes(s)).toBe(s);
  });
});

describe('deepStripLongDashes', () => {
  it('walks nested objects and arrays, leaving non-strings untouched', () => {
    const input = {
      score: 62,
      verdict: 'Mid — room to grow',
      audit: {
        cv: {
          issues: [
            {
              id: 'cv-abc123',
              what: 'Passive voice — weak verbs',
              severity: 'major',
            },
          ],
        },
      },
      range: { min: 55000, max: 75000 },
    };
    const out = deepStripLongDashes(input);
    expect(out.verdict).toBe('Mid, room to grow');
    expect(out.audit.cv.issues[0].what).toBe('Passive voice, weak verbs');
    expect(out.audit.cv.issues[0].id).toBe('cv-abc123');
    expect(out.score).toBe(62);
    expect(out.range).toEqual({ min: 55000, max: 75000 });
  });

  it('does not mutate the input', () => {
    const input = { text: 'a — b' };
    deepStripLongDashes(input);
    expect(input.text).toBe('a — b');
  });
});
