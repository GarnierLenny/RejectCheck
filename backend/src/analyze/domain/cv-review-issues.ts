/**
 * Stable identity for CV-audit issues — the deterministic half of the "stop
 * feeling forced to find flaws" fix (the prompt half lives in
 * CV_REVIEW_SHARED_RULES + the tool schema's issue description).
 *
 * `assignCvReviewIssueIds` gives every audit issue a stable id derived from its
 * category + text, so a re-scan diffs issues by identity, not array position.
 * `computeIssueId` is exported so the re-scan delta can key legacy rows (stored
 * before ids existed) with the SAME hash — otherwise the first re-scan of an
 * old audit would report total churn (raw-text keys never intersect hashed ids).
 *
 * NOTE: we deliberately do NOT filter issues by severity here. A strong CV
 * reading clean is enforced at the source (the prompt tells the model to return
 * few or zero issues), not by hiding genuine findings after the fact — hiding
 * real problems from a "good" CV would be its own dishonesty.
 *
 * Pure: no I/O, no dates, no randomness. Mutates the passed result in place and
 * returns it (same pattern as the anchoring / anti-fabrication passes).
 */

import type { CvReviewResponse } from '../dto/cv-review-response.dto';

/** Deterministic, dependency-free FNV-1a hash → 8 hex chars. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function normalizeWhat(s: string | undefined): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120);
}

/**
 * Stable id for an audit issue from its category + normalized text. Robust to
 * whitespace/case drift (not to full LLM rephrasing — see the re-scan prompt
 * rule). Used both to assign ids and to key legacy rows in the diff.
 */
export function computeIssueId(
  category: string | undefined,
  what: string | undefined,
): string {
  return hash(`${category ?? ''}|${normalizeWhat(what)}`);
}

type AuditIssue = {
  id?: string;
  severity?: string;
  category?: string;
  what?: string;
};

function auditIssueBuckets(
  result: CvReviewResponse,
): Array<{ issues?: AuditIssue[] } | undefined> {
  const audit = result.audit as
    | {
        cv?: { issues?: AuditIssue[] };
        github?: { issues?: AuditIssue[] };
        linkedin?: { issues?: AuditIssue[] };
      }
    | undefined;
  return [audit?.cv, audit?.github, audit?.linkedin];
}

/**
 * Assign a stable id to every audit issue that lacks one, so the re-scan delta
 * matches issues by identity across runs.
 */
export function assignCvReviewIssueIds(
  result: CvReviewResponse,
): CvReviewResponse {
  for (const bucket of auditIssueBuckets(result)) {
    for (const issue of bucket?.issues ?? []) {
      if (!issue.id) issue.id = computeIssueId(issue.category, issue.what);
    }
  }
  return result;
}
