import { attachFixes } from './analyze-response.dto';

type Issue = { what: string };
type Fix = { summary: string };

const issues: Issue[] = [{ what: 'a' }, { what: 'b' }, { what: 'c' }];

describe('attachFixes (hot/deep alignment guard)', () => {
  it('attaches fixes positionally when lengths match', () => {
    const fixes: Fix[] = [{ summary: 'fa' }, { summary: 'fb' }, { summary: 'fc' }];
    const out = attachFixes(issues, fixes, 'audit_cv_issues');
    expect(out.map((o) => o.fix?.summary)).toEqual(['fa', 'fb', 'fc']);
    expect(out.map((o) => o.what)).toEqual(['a', 'b', 'c']);
  });

  it('leaves fixes undefined when the deep pass has not arrived', () => {
    const out = attachFixes(issues, undefined, 'audit_cv_issues');
    expect(out.every((o) => o.fix === undefined)).toBe(true);
  });

  it('DROPS all fixes on a length mismatch rather than misattaching', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Model returned 2 fixes for 3 issues — attaching by index would bind the
    // wrong fix to issue "c" (or leave it fixless while shifting the others).
    const fixes: Fix[] = [{ summary: 'fa' }, { summary: 'fb' }];
    const out = attachFixes(issues, fixes, 'audit_cv_issues');
    expect(out.every((o) => o.fix === undefined)).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[MERGE_ALIGN] audit_cv_issues'),
    );
    warn.mockRestore();
  });

  it('drops fixes when the model returns extra fixes too', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fixes: Fix[] = [
      { summary: 'fa' },
      { summary: 'fb' },
      { summary: 'fc' },
      { summary: 'fd' },
    ];
    const out = attachFixes(issues, fixes, 'hidden_red_flags');
    expect(out.every((o) => o.fix === undefined)).toBe(true);
    warn.mockRestore();
  });

  it('handles empty issues with empty fixes', () => {
    expect(attachFixes([], [], 'audit_github_issues')).toEqual([]);
  });
});
