import { assignCvReviewIssueIds, computeIssueId } from './cv-review-issues';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';

function mk(
  issues: Array<{
    id?: string;
    severity?: string;
    category?: string;
    what: string;
  }>,
): CvReviewResponse {
  return {
    audit: {
      cv: { score: 60, issues },
      github: { score: null, issues: [] },
      linkedin: { score: null, issues: [] },
    },
  } as unknown as CvReviewResponse;
}

describe('computeIssueId', () => {
  it('is stable across whitespace / case drift', () => {
    expect(computeIssueId('impact', 'Bullets lack metrics')).toBe(
      computeIssueId('impact', '  bullets   lack METRICS '),
    );
  });

  it('differs by category and by text', () => {
    expect(computeIssueId('impact', 'a')).not.toBe(
      computeIssueId('format', 'a'),
    );
    expect(computeIssueId('impact', 'a')).not.toBe(
      computeIssueId('impact', 'b'),
    );
  });
});

describe('assignCvReviewIssueIds', () => {
  it('assigns computeIssueId to issues without one, and keeps existing ids', () => {
    const r = mk([
      { category: 'impact', what: 'no metrics' },
      { id: 'preset', category: 'format', what: 'dates' },
    ]);
    assignCvReviewIssueIds(r);
    const [a, b] = r.audit.cv.issues as Array<{ id?: string }>;
    expect(a.id).toBe(computeIssueId('impact', 'no metrics'));
    expect(b.id).toBe('preset');
  });
});
