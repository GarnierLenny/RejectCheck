/**
 * ANCHORED, EXPLAINABLE scoring layer (the trust backbone).
 *
 * The model emits the overall rejection-risk score, the verdict and the five
 * breakdown scalars as INDEPENDENT numbers, so the headline can silently
 * contradict its own parts and can wiggle run-to-run at temperature 0.1. This
 * module fixes both — the same way `deriveAtsWouldPass` fixes the ATS badge:
 *
 *  1. `breakdown.keyword_match` is replaced by the DETERMINISTIC keyword
 *     coverage (same JD+CV → same number). The model no longer owns that cell.
 *  2. The remaining LLM sub-scores are QUANTIZED to a coarse step so sub-bucket
 *     jitter never moves the displayed number.
 *  3. The overall risk is RECOMPUTED from a transparent weighted formula over
 *     the (now anchored) breakdown + ATS estimate, plus additive penalties for
 *     the hard rejection signals a recruiter reacts to (hidden red flags,
 *     critical audit issues, fatal bullets). The headline can no longer
 *     contradict the parts shown beneath it.
 *  4. The verdict is derived from the risk band, never trusted from the model.
 *
 * Honesty note: bit-for-bit reproducibility only holds for the keyword layer.
 * The other inputs are genuine LLM judgment — quantization makes the composite
 * STABLE (it won't twitch for trivial variance) and EXPLAINABLE (a pure
 * function of its parts), not deterministic. That is the intended trade-off:
 * we keep the contextual judgment that is the moat and stop the headline from
 * behaving like an unaccountable guess.
 *
 * Pure: no I/O, no dates, no randomness. Trivially unit-testable, and covered
 * by the two-tier stability harness (deterministic specs + real-API drift job).
 */

import type { AnalyzeResponse } from '../../dto/analyze-response.dto';

/** Rounding step for LLM-judged sub-scores and the composite risk. */
export const QUANT_STEP = 5;

/**
 * Fit weights (higher component = stronger match = lower risk). Sum to 1 over
 * the components PRESENT for a given analysis: when github/linkedin are absent
 * their weight is renormalised away rather than counted as a zero, so a missing
 * source never silently tanks the score. keyword_match carries the most weight
 * because it is the reproducible anchor.
 */
const FIT_WEIGHTS = {
  keyword_match: 0.3,
  tech_stack_fit: 0.25,
  experience_level: 0.2,
  ats: 0.1,
  github_signal: 0.075,
  linkedin_signal: 0.075,
} as const;

/**
 * Additive RISK penalties (in points) for the hard rejection signals a senior
 * recruiter reacts to. Each is capped so a noisy long list can't dominate the
 * score, but their presence must move the headline up even when the raw fit
 * scores look mediocre-but-not-terrible.
 */
const REDFLAG_RISK = 4;
const REDFLAG_CAP = 12;
const CRITICAL_ISSUE_RISK = 3;
const CRITICAL_ISSUE_CAP = 9;
const FATAL_BULLET_RISK = 2;
const FATAL_BULLET_CAP = 8;

/**
 * Verdict bands on the composite risk (0 = strong match, 100 = weak match).
 * Aligned with the shared competitiveness bands: Strong >= 80 (risk <= 20),
 * Weak < 40 (risk > 60). Same cutoffs the CV-audit scorer and RiskMeter use, so
 * an equal number means an equal tier on both screens.
 */
const VERDICT_LOW_MAX = 20;
const VERDICT_HIGH_MIN = 60;

/** Clamp to the 0-100 score range. */
function clamp0100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Round to the nearest QUANT_STEP, clamped to 0-100. */
export function quantize(n: number, step: number = QUANT_STEP): number {
  return Math.round(clamp0100(n) / step) * step;
}

/**
 * Deflation strength for {@link deflate}. LLM sub-scores cluster generously in
 * the 70-90 band, so a merely-decent dossier scores like an excellent one. This
 * spreads that cluster downward. Tunable knob (0 = no deflation, higher = more).
 * Must stay < 1 to keep {@link deflate} monotonically increasing.
 */
export const DEFLATION = 0.85;

/**
 * Deflate a raw 0-100 fit/quality score to spread the compressed high cluster.
 * Anchored parabola: keeps the endpoints (0 -> 0, 100 -> 100) but pulls the
 * middle down, so a genuinely strong dossier stays high while an average one
 * drops to mid. This calibrates the MEASUREMENT (LLM generosity), it is NOT a
 * market-outcome guess. Shared by the vs-JD composite and the CV-audit quality.
 */
export function deflate(raw: number): number {
  const x = clamp0100(raw);
  return clamp0100(x + (DEFLATION * x * (x - 100)) / 100);
}

/** Verdict is a pure function of the risk band — never trusted from the model. */
export function deriveVerdict(risk: number): 'Low' | 'Medium' | 'High' {
  if (risk <= VERDICT_LOW_MAX) return 'Low';
  if (risk >= VERDICT_HIGH_MIN) return 'High';
  return 'Medium';
}

export type AnchoredBreakdown = {
  keyword_match: number;
  tech_stack_fit: number;
  experience_level: number;
  github_signal: number | null;
  linkedin_signal: number | null;
};

export type ComposeRiskInput = {
  breakdown: AnchoredBreakdown;
  atsScore: number;
  redFlagCount: number;
  criticalIssueCount: number;
  fatalBulletCount: number;
};

/**
 * Recompute the overall rejection risk from the anchored parts. Higher = weaker
 * match (more risk). Weighted fit is inverted to risk, then hard-signal
 * penalties are added, then the result is quantized so it can't twitch.
 */
export function composeRisk(input: ComposeRiskInput): number {
  const b = input.breakdown;
  const parts: Array<[number, number]> = [
    [b.keyword_match, FIT_WEIGHTS.keyword_match],
    [b.tech_stack_fit, FIT_WEIGHTS.tech_stack_fit],
    [b.experience_level, FIT_WEIGHTS.experience_level],
    [input.atsScore, FIT_WEIGHTS.ats],
  ];
  if (b.github_signal != null) {
    parts.push([b.github_signal, FIT_WEIGHTS.github_signal]);
  }
  if (b.linkedin_signal != null) {
    parts.push([b.linkedin_signal, FIT_WEIGHTS.linkedin_signal]);
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

  // Deflate the fit (competitiveness) before inverting to risk, then add the
  // hard-signal penalties. Deflation spreads the generous LLM cluster; penalties
  // still bite on top.
  return quantize(100 - deflate(fit) + penalty);
}

/**
 * Anchor a raw breakdown: replace keyword_match with the deterministic coverage
 * (falling back to the quantized LLM value when the JD has no recognised skills,
 * e.g. a non-tech role), and quantize the LLM-judged sub-scores. Shared by the
 * streamed `breakdown` section and the final payload so both agree.
 */
export function anchorBreakdown(
  raw: {
    keyword_match: number;
    tech_stack_fit: number;
    experience_level: number;
    github_signal: number | null;
    linkedin_signal: number | null;
  },
  coverageScore: number | null,
): AnchoredBreakdown {
  return {
    keyword_match:
      coverageScore != null
        ? clamp0100(coverageScore)
        : quantize(raw.keyword_match),
    tech_stack_fit: quantize(raw.tech_stack_fit),
    experience_level: quantize(raw.experience_level),
    github_signal:
      raw.github_signal == null ? null : quantize(raw.github_signal),
    linkedin_signal:
      raw.linkedin_signal == null ? null : quantize(raw.linkedin_signal),
  };
}

/** Count `critical` audit issues across cv / github / linkedin. */
function countCriticalIssues(result: AnalyzeResponse): number {
  const buckets = [
    result.audit?.cv?.issues,
    result.audit?.github?.issues,
    result.audit?.linkedin?.issues,
  ];
  let n = 0;
  for (const bucket of buckets) {
    for (const issue of bucket ?? []) {
      if ((issue as { severity?: string })?.severity === 'critical') n += 1;
    }
  }
  return n;
}

/** Count `fatal` bullets in the bullet-by-bullet review. */
function countFatalBullets(result: AnalyzeResponse): number {
  return (
    result.bullet_reviews?.bullets?.filter((b) => b.verdict === 'fatal')
      .length ?? 0
  );
}

/**
 * Return a new AnalyzeResponse with the anchored breakdown, the anchored ATS
 * estimate (quantized score + re-derived would_pass), the recomputed composite
 * risk, and the band-derived verdict. Never mutates the input.
 *
 * `coverageScore` is the deterministic keyword coverage (0-100) or null when the
 * JD lists no recognised skills.
 */
export function anchorScores(
  result: AnalyzeResponse,
  coverageScore: number | null,
): AnalyzeResponse {
  const breakdown = anchorBreakdown(result.breakdown, coverageScore);

  const ats = result.ats_simulation;
  const atsScore = quantize(ats.score);
  const ats_simulation = {
    ...ats,
    score: atsScore,
    would_pass: atsScore >= ats.threshold,
  };

  const risk = composeRisk({
    breakdown,
    atsScore,
    redFlagCount: result.hidden_red_flags?.length ?? 0,
    criticalIssueCount: countCriticalIssues(result),
    fatalBulletCount: countFatalBullets(result),
  });

  return {
    ...result,
    breakdown,
    ats_simulation,
    score: risk,
    verdict: deriveVerdict(risk),
  };
}
