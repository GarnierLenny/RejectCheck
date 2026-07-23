/**
 * Pure before/after diff for the re-scan loop.
 *
 * Given the ORIGINAL analysis and the re-scanned one, compute the per-dimension
 * movement the UI renders as "42 → 68 (+26)" badges, plus how many of the
 * original issues the user actually resolved. No I/O, no dates — trivially
 * testable and safe to run on stored rows.
 */

import type { AnalyzeResponse } from '../dto/analyze-response.dto';

/** A single before/after movement. `delta` is null when a side is unknown. */
export type Delta = {
  before: number | null;
  after: number | null;
  delta: number | null;
};

export type RescanDeltas = {
  /** Overall match score. */
  score: Delta;
  /** Each of the 5 breakdown scalars (github/linkedin can be null). */
  breakdown: {
    keyword_match: Delta;
    tech_stack_fit: Delta;
    experience_level: Delta;
    github_signal: Delta;
    linkedin_signal: Delta;
  };
  /** ATS pass flag + estimate score, before and after. */
  ats: {
    wouldPassBefore: boolean;
    wouldPassAfter: boolean;
    scoreBefore: number;
    scoreAfter: number;
  };
  /**
   * Deterministic keyword coverage, before and after. Sourced from the
   * keyword-match layer, not the LLM — this is the verifiable number.
   */
  keywordCoverage: Delta;
  /** How many issues flagged in the original are gone in the re-scan. */
  resolvedIssueCount: number;
  /** How many issues appeared that weren't in the original. */
  newIssueCount: number;
};

/** Build a Delta from two possibly-null numbers. */
function toDelta(before: number | null, after: number | null): Delta {
  const delta =
    before === null || after === null ? null : round(after - before);
  return { before, after, delta };
}

function round(n: number): number {
  return Math.round(n);
}

/**
 * Stable identity of an audit issue across re-scans. Prefers the deterministic
 * hot-pass `id` (slug of scope + hash of `what`); falls back to the `what` text
 * for legacy rows that predate stable ids.
 */
function issueKey(issue: { id?: string; what?: string }): string {
  return issue.id ?? issue.what ?? '';
}

/** Collect every audit-issue key across cv / github / linkedin. */
function collectIssueKeys(result: AnalyzeResponse): Set<string> {
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

export type ComputeDeltasOptions = {
  /** Deterministic keyword coverage of the ORIGINAL (0-100 or null). */
  coverageBefore?: number | null;
  /** Deterministic keyword coverage of the RE-SCAN (0-100 or null). */
  coverageAfter?: number | null;
};

/**
 * Diff two analyses. `before` is the original, `after` the re-scan. Keyword
 * coverage is passed in from the deterministic layer (the AnalyzeResponse
 * doesn't carry it).
 */
export function computeDeltas(
  before: AnalyzeResponse,
  after: AnalyzeResponse,
  opts: ComputeDeltasOptions = {},
): RescanDeltas {
  const beforeKeys = collectIssueKeys(before);
  const afterKeys = collectIssueKeys(after);

  let resolvedIssueCount = 0;
  for (const key of beforeKeys)
    if (!afterKeys.has(key)) resolvedIssueCount += 1;
  let newIssueCount = 0;
  for (const key of afterKeys) if (!beforeKeys.has(key)) newIssueCount += 1;

  return {
    score: toDelta(before.score, after.score),
    breakdown: {
      keyword_match: toDelta(
        before.breakdown.keyword_match,
        after.breakdown.keyword_match,
      ),
      tech_stack_fit: toDelta(
        before.breakdown.tech_stack_fit,
        after.breakdown.tech_stack_fit,
      ),
      experience_level: toDelta(
        before.breakdown.experience_level,
        after.breakdown.experience_level,
      ),
      github_signal: toDelta(
        before.breakdown.github_signal,
        after.breakdown.github_signal,
      ),
      linkedin_signal: toDelta(
        before.breakdown.linkedin_signal,
        after.breakdown.linkedin_signal,
      ),
    },
    ats: {
      wouldPassBefore: before.ats_simulation.would_pass,
      wouldPassAfter: after.ats_simulation.would_pass,
      scoreBefore: before.ats_simulation.score,
      scoreAfter: after.ats_simulation.score,
    },
    keywordCoverage: toDelta(
      opts.coverageBefore ?? null,
      opts.coverageAfter ?? null,
    ),
    resolvedIssueCount,
    newIssueCount,
  };
}
