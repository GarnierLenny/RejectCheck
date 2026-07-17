import { computeCvReviewDeltas } from './cv-review-rescan-delta';
import { assignCvReviewIssueIds, computeIssueId } from './cv-review-issues';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';

type PartialQuality = Partial<CvReviewResponse['cv_quality']>;

function mk(opts: {
  quality?: PartialQuality;
  atsScore?: number;
  cvIssues?: Array<{ id?: string; category?: string; what: string }>;
}): CvReviewResponse {
  const quality = {
    overall: 40,
    clarity: 40,
    impact: 40,
    hard_skills: 40,
    soft_skills: 40,
    consistency: 40,
    ats_format: 40,
    ...opts.quality,
  };
  return {
    score: quality.overall,
    cv_quality: quality,
    ats_audit: { score: opts.atsScore ?? 50, issues: [] },
    audit: {
      cv: { score: quality.overall, issues: opts.cvIssues ?? [] },
      github: { score: null, issues: [] },
      linkedin: { score: null, issues: [] },
    },
  } as unknown as CvReviewResponse;
}

describe('computeCvReviewDeltas', () => {
  it('diffs the anchored overall and each sub-score', () => {
    const before = mk({ quality: { overall: 40, impact: 20 } });
    const after = mk({ quality: { overall: 55, impact: 45 } });
    const d = computeCvReviewDeltas(before, after);
    expect(d.overall).toEqual({ before: 40, after: 55, delta: 15 });
    expect(d.subScores.impact).toEqual({ before: 20, after: 45, delta: 25 });
    expect(d.subScores.clarity).toEqual({ before: 40, after: 40, delta: 0 });
  });

  it('diffs the ATS structural score', () => {
    const d = computeCvReviewDeltas(
      mk({ atsScore: 50 }),
      mk({ atsScore: 70 }),
    );
    expect(d.atsAudit).toEqual({ before: 50, after: 70, delta: 20 });
  });

  it('counts resolved and new audit issues by identity', () => {
    const before = mk({ cvIssues: [{ what: 'A' }, { what: 'B' }] });
    const after = mk({ cvIssues: [{ what: 'B' }, { what: 'C' }] });
    const d = computeCvReviewDeltas(before, after);
    expect(d.resolvedIssueCount).toBe(1); // A gone
    expect(d.newIssueCount).toBe(1); // C appeared
  });

  it('reports zero churn when the issue set is unchanged', () => {
    const issues = [{ what: 'A' }, { what: 'B' }];
    const d = computeCvReviewDeltas(mk({ cvIssues: issues }), mk({ cvIssues: issues }));
    expect(d.resolvedIssueCount).toBe(0);
    expect(d.newIssueCount).toBe(0);
  });

  it('reports zero churn for a LEGACY parent (no ids) vs a fresh child (ids assigned)', () => {
    // The regression the reviewer caught: a parent stored before ids existed
    // has raw-text issues and no id; the child gets hashed ids. Keying the
    // legacy side through computeIssueId keeps both in the same space.
    const parent = mk({
      cvIssues: [
        { category: 'impact', what: 'Bullets lack metrics' },
        { category: 'format', what: 'Inconsistent dates' },
      ],
    });
    const child = mk({
      cvIssues: [
        { id: computeIssueId('impact', 'Bullets lack metrics'), category: 'impact', what: 'Bullets lack metrics' },
        { id: computeIssueId('format', 'Inconsistent dates'), category: 'format', what: 'Inconsistent dates' },
      ],
    });
    const d = computeCvReviewDeltas(parent, child);
    expect(d.resolvedIssueCount).toBe(0);
    expect(d.newIssueCount).toBe(0);
  });

  it('still detects a genuinely resolved issue after ids are assigned', () => {
    const parent = mk({ cvIssues: [{ category: 'impact', what: 'no metrics' }, { category: 'tone', what: 'passive voice' }] });
    // child fixed the passive-voice one; assignCvReviewIssueIds stamps ids.
    const child = mk({ cvIssues: [{ category: 'impact', what: 'no metrics' }] });
    assignCvReviewIssueIds(child);
    const d = computeCvReviewDeltas(parent, child);
    expect(d.resolvedIssueCount).toBe(1); // passive voice gone
    expect(d.newIssueCount).toBe(0);
  });
});
