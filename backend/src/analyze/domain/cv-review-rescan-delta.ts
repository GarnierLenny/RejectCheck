/**
 * Pure before/after diff for the STANDALONE CV-audit re-scan loop (no JD).
 *
 * The sibling `rescan-delta.ts` diffs two vs-JD analyses (rejection risk +
 * breakdown scalars + keyword coverage). This does the equivalent for a CV audit
 * re-run: it diffs the six cv_quality sub-scores, the anchored `overall`, the
 * ats_audit structural score, and counts how many audit issues the user actually
 * resolved. The UI renders these as "40 → 55 (+15)" badges — the payoff that
 * makes the audit a measurable loop instead of a one-shot verdict.
 *
 * No I/O, no dates, no randomness. Trivially unit-testable and safe on stored
 * rows.
 */

import type { CvReviewResponse } from '../dto/cv-review-response.dto';
import type { Delta } from './rescan-delta';
import { computeIssueId } from './cv-review-issues';

export type CvReviewRescanDeltas = {
  /** Anchored quality headline (weighted average of the six sub-scores). */
  overall: Delta;
  /** Each of the six cv_quality sub-scores, before and after. */
  subScores: {
    clarity: Delta;
    impact: Delta;
    hard_skills: Delta;
    soft_skills: Delta;
    consistency: Delta;
    ats_format: Delta;
  };
  /** Structural ATS-format score, before and after. */
  atsAudit: Delta;
  /** How many issues flagged in the original are gone in the re-scan. */
  resolvedIssueCount: number;
  /** How many issues appeared that weren't in the original. */
  newIssueCount: number;
};

function toDelta(before: number | null, after: number | null): Delta {
  const delta =
    before === null || after === null ? null : Math.round(after - before);
  return { before, after, delta };
}

/**
 * Stable identity of an audit issue across re-scans. Prefers the assigned id,
 * else recomputes the SAME hash from category + text. Critical: a legacy parent
 * row stored before ids existed has no `id`, while a fresh re-audit does — using
 * the shared computeIssueId as the fallback keeps both sides in the same key
 * space, so the first re-scan of an old audit doesn't report total churn.
 */
function issueKey(issue: {
  id?: string;
  category?: string;
  what?: string;
}): string {
  return issue.id ?? computeIssueId(issue.category, issue.what);
}

/** Collect every audit-issue key across cv / github / linkedin. */
function collectIssueKeys(result: CvReviewResponse): Set<string> {
  const keys = new Set<string>();
  const buckets = [
    result.audit?.cv?.issues,
    result.audit?.github?.issues,
    result.audit?.linkedin?.issues,
  ];
  for (const bucket of buckets) {
    for (const issue of bucket ?? []) {
      const key = issueKey(issue);
      if (key) keys.add(key);
    }
  }
  return keys;
}

function sub(
  before: CvReviewResponse['cv_quality'] | undefined,
  after: CvReviewResponse['cv_quality'] | undefined,
  key: keyof NonNullable<CvReviewResponse['cv_quality']>,
): Delta {
  return toDelta(before?.[key] ?? null, after?.[key] ?? null);
}

/**
 * Diff two CV audits. `before` is the original, `after` the re-run on the edited
 * CV. Both should already be anchored (overall = weighted average of the
 * sub-scores) by compose-cv-review-score.
 */
export function computeCvReviewDeltas(
  before: CvReviewResponse,
  after: CvReviewResponse,
): CvReviewRescanDeltas {
  const beforeKeys = collectIssueKeys(before);
  const afterKeys = collectIssueKeys(after);

  let resolvedIssueCount = 0;
  for (const key of beforeKeys)
    if (!afterKeys.has(key)) resolvedIssueCount += 1;
  let newIssueCount = 0;
  for (const key of afterKeys) if (!beforeKeys.has(key)) newIssueCount += 1;

  const bq = before.cv_quality;
  const aq = after.cv_quality;

  return {
    overall: toDelta(bq?.overall ?? null, aq?.overall ?? null),
    subScores: {
      clarity: sub(bq, aq, 'clarity'),
      impact: sub(bq, aq, 'impact'),
      hard_skills: sub(bq, aq, 'hard_skills'),
      soft_skills: sub(bq, aq, 'soft_skills'),
      consistency: sub(bq, aq, 'consistency'),
      ats_format: sub(bq, aq, 'ats_format'),
    },
    atsAudit: toDelta(
      before.ats_audit?.score ?? null,
      after.ats_audit?.score ?? null,
    ),
    resolvedIssueCount,
    newIssueCount,
  };
}
