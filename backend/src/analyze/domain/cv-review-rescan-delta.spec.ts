import { computeCvReviewDeltas } from './cv-review-rescan-delta';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';

type PartialQuality = Partial<CvReviewResponse['cv_quality']>;

function mk(opts: {
  quality?: PartialQuality;
  atsScore?: number;
  cvIssues?: Array<{ what: string }>;
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
});
