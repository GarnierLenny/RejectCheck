import { SectionStreamParser } from './section-stream.parser';

/** Feed `json` to a fresh parser in chunks of `size`, collect emissions. */
function run(json: string, size: number) {
  const sections: Array<[string, unknown]> = [];
  const starts: string[] = [];
  const parser = new SectionStreamParser({
    onSectionStart: (k) => starts.push(k),
    onSection: (k, v) => sections.push([k, v]),
  });
  for (let i = 0; i < json.length; i += size) {
    parser.push(json.slice(i, i + size));
  }
  return { sections, starts };
}

// Shape mirroring the real tool output: scalars, nulls, strings with escapes
// and braces, nested objects/arrays.
const SAMPLE = JSON.stringify({
  job_details: { title: 'Back-End Developer', company: 'Acme "Corp"', pay: null },
  overall: { score: 62, verdict: 'Medium', confidence: { score: 80, reason: 'ok' } },
  keyword_match: 71,
  github_signal: null,
  ats_simulation: { would_pass: false, score: 55, threshold: 70, reason: 'weak {braces} [brackets] "quotes"' },
  audit_cv: {
    score: 48,
    issues: [
      { what: 'code: `if (a) { b[0] = "x"; }`', why: 'escaped \\ and "nested"' },
      { what: 'plain', why: 'plain' },
    ],
  },
  hidden_red_flags: [{ flag: 'gap', perception: '18 months, unexplained' }],
});

const EXPECTED_KEYS = [
  'job_details',
  'overall',
  'keyword_match',
  'github_signal',
  'ats_simulation',
  'audit_cv',
  'hidden_red_flags',
];

describe('SectionStreamParser', () => {
  it.each([1, 3, 7, 17, SAMPLE.length])(
    'emits every top-level section with chunk size %d',
    (size) => {
      const { sections } = run(SAMPLE, size);
      expect(sections.map(([k]) => k)).toEqual(EXPECTED_KEYS);
      expect(Object.fromEntries(sections)).toEqual(JSON.parse(SAMPLE));
    },
  );

  it('fires onSectionStart for each key, before its onSection, in order', () => {
    const events: string[] = [];
    const parser = new SectionStreamParser({
      onSectionStart: (k) => events.push(`start:${k}`),
      onSection: (k) => events.push(`done:${k}`),
    });
    parser.push(SAMPLE);
    for (const key of EXPECTED_KEYS) {
      const start = events.indexOf(`start:${key}`);
      const done = events.indexOf(`done:${key}`);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(done).toBe(start + 1);
    }
  });

  it('survives a delta cut in the middle of an escape sequence', () => {
    const json = '{"a": "before \\" after", "b": 1}';
    const cut = json.indexOf('\\') + 1; // between backslash and quote
    const sections: Array<[string, unknown]> = [];
    const parser = new SectionStreamParser({
      onSection: (k, v) => sections.push([k, v]),
    });
    parser.push(json.slice(0, cut));
    parser.push(json.slice(cut));
    expect(sections).toEqual([
      ['a', 'before " after'],
      ['b', 1],
    ]);
  });

  it('handles a scalar as the last property (closed by the root brace)', () => {
    const { sections } = run('{"x": {"y": 1}, "score": 42}', 5);
    expect(sections).toEqual([
      ['x', { y: 1 }],
      ['score', 42],
    ]);
  });

  it('handles booleans, nulls and whitespace-heavy JSON', () => {
    const json = '{\n  "a" : true ,\n  "b" : null ,\n  "c" : [ 1 , 2 ]\n}\n';
    const { sections } = run(json, 2);
    expect(sections).toEqual([
      ['a', true],
      ['b', null],
      ['c', [1, 2]],
    ]);
  });

  it('a throwing handler skips that section but not the following ones', () => {
    const seen: string[] = [];
    const parser = new SectionStreamParser({
      onSection: (k) => {
        if (k === 'overall') throw new Error('boom');
        seen.push(k);
      },
    });
    parser.push('{"overall": {"score": 1}, "keyword_match": 3}');
    expect(seen).toEqual(['keyword_match']);
  });

  it('emits nothing more after an incomplete stream (no trailing garbage)', () => {
    const sections: Array<[string, unknown]> = [];
    const parser = new SectionStreamParser({
      onSection: (k, v) => sections.push([k, v]),
    });
    parser.push('{"a": 1, "b": {"unfinished": ');
    expect(sections).toEqual([['a', 1]]);
  });

  it('keys containing colons or commas inside string values do not confuse it', () => {
    const json = '{"a": "x: y, z", "b": {"c": "d, e: f"}}';
    const { sections } = run(json, 4);
    expect(sections).toEqual([
      ['a', 'x: y, z'],
      ['b', { c: 'd, e: f' }],
    ]);
  });
});
