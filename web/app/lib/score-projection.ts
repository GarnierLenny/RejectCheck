/**
 * CLIENT-SIDE score projection for the inline re-scan loop (move 4).
 *
 * As the user checks off missing keywords or marks flagged bullets as fixed, we
 * recompute — instantly and for free, no LLM, no network — what their anchored
 * score WOULD become. This is a projection, not a commitment: the authoritative
 * recompute happens when they run a full re-scan (POST :id/rescan-inline), which
 * re-runs the model on the edited CV and may move the LLM-judged parts too.
 *
 * ⚠️ KEEP IN SYNC with backend/src/analyze/domain/score/compose-score.ts and
 * backend/src/analyze/domain/keyword-match/keyword-match.ts. The constants and
 * formulas below MUST match the backend exactly, or the free live projection
 * would disagree with the paid re-scan — reintroducing the "two divergent
 * numbers" problem P0 just fixed. The web app has no test runner; the backend
 * compose-score.spec.ts pins these numbers (see the parity scenarios noted
 * inline below).
 */

/** Rounding step for LLM sub-scores and the composite risk. Backend: QUANT_STEP. */
export const QUANT_STEP = 5;

// Keyword-coverage weights (keyword-match.ts): a missing must-have hurts 2x.
const REQUIRED_WEIGHT = 2;
const OPTIONAL_WEIGHT = 1;

// Fit weights (compose-score.ts FIT_WEIGHTS), renormalised over present parts.
const FIT_WEIGHTS = {
  keyword_match: 0.3,
  tech_stack_fit: 0.25,
  experience_level: 0.2,
  ats: 0.1,
  github_signal: 0.075,
  linkedin_signal: 0.075,
} as const;

// Additive risk penalties (compose-score.ts), each capped.
const REDFLAG_RISK = 4;
const REDFLAG_CAP = 12;
const CRITICAL_ISSUE_RISK = 3;
const CRITICAL_ISSUE_CAP = 9;
const FATAL_BULLET_RISK = 2;
const FATAL_BULLET_CAP = 8;

// Verdict bands on the composite risk.
const VERDICT_LOW_MAX = 30;
const VERDICT_HIGH_MIN = 65;

export type Verdict = "Low" | "Medium" | "High";

function clamp0100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Round to the nearest QUANT_STEP, clamped 0-100. Backend: quantize(). */
export function quantize(n: number, step: number = QUANT_STEP): number {
  return Math.round(clamp0100(n) / step) * step;
}

/** Verdict from the risk band. Backend: deriveVerdict(). */
export function deriveVerdict(risk: number): Verdict {
  if (risk <= VERDICT_LOW_MAX) return "Low";
  if (risk >= VERDICT_HIGH_MIN) return "High";
  return "Medium";
}

export type ProjectionKeywordRow = {
  term: string;
  required: boolean;
  presentInCv: boolean;
};

/**
 * Projected deterministic keyword coverage if `addedTerms` were present in the
 * CV. Mirrors matchKeywords' coverageScore (required 2x). Returns null when the
 * JD lists no recognised skills (non-tech role), matching the backend.
 */
export function projectCoverage(
  rows: ProjectionKeywordRow[],
  addedTerms: Set<string>,
): number | null {
  let totalWeight = 0;
  let matchedWeight = 0;
  for (const r of rows) {
    const w = r.required ? REQUIRED_WEIGHT : OPTIONAL_WEIGHT;
    totalWeight += w;
    if (r.presentInCv || addedTerms.has(r.term)) matchedWeight += w;
  }
  if (totalWeight === 0) return null;
  return Math.round((100 * matchedWeight) / totalWeight);
}

export type ProjectRiskInput = {
  /** Projected keyword coverage (0-100), or null → fall back to keywordMatch. */
  coverageScore: number | null;
  /** LLM sub-scores from the current result (already anchored/quantized). */
  keywordMatch: number;
  techStackFit: number;
  experienceLevel: number;
  githubSignal: number | null;
  linkedinSignal: number | null;
  atsScore: number;
  /** Hard rejection-signal counts, decremented as the user resolves them. */
  redFlagCount: number;
  criticalIssueCount: number;
  fatalBulletCount: number;
};

/**
 * Projected anchored rejection risk + verdict. Mirrors composeRisk(): weighted
 * fit inverted to risk, plus capped hard-signal penalties, quantized.
 *
 * Parity check (matches compose-score.spec.ts "composite formula lock"):
 * coverage 62, tech 65, exp 45, github 60, linkedin 40, ats 60, 1 red flag,
 * 1 critical, 1 fatal → risk 50 / Medium.
 */
export function projectRisk(input: ProjectRiskInput): {
  risk: number;
  verdict: Verdict;
} {
  const keyword =
    input.coverageScore != null
      ? clamp0100(input.coverageScore)
      : quantize(input.keywordMatch);

  const parts: Array<[number, number]> = [
    [keyword, FIT_WEIGHTS.keyword_match],
    [quantize(input.techStackFit), FIT_WEIGHTS.tech_stack_fit],
    [quantize(input.experienceLevel), FIT_WEIGHTS.experience_level],
    [quantize(input.atsScore), FIT_WEIGHTS.ats],
  ];
  if (input.githubSignal != null) {
    parts.push([quantize(input.githubSignal), FIT_WEIGHTS.github_signal]);
  }
  if (input.linkedinSignal != null) {
    parts.push([quantize(input.linkedinSignal), FIT_WEIGHTS.linkedin_signal]);
  }

  const totalWeight = parts.reduce((sum, [, w]) => sum + w, 0);
  const fit =
    totalWeight === 0
      ? 0
      : parts.reduce((sum, [v, w]) => sum + clamp0100(v) * w, 0) / totalWeight;

  const penalty =
    Math.min(REDFLAG_CAP, Math.max(0, input.redFlagCount) * REDFLAG_RISK) +
    Math.min(
      CRITICAL_ISSUE_CAP,
      Math.max(0, input.criticalIssueCount) * CRITICAL_ISSUE_RISK,
    ) +
    Math.min(
      FATAL_BULLET_CAP,
      Math.max(0, input.fatalBulletCount) * FATAL_BULLET_RISK,
    );

  const risk = quantize(100 - fit + penalty);
  return { risk, verdict: deriveVerdict(risk) };
}
