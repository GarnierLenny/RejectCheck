import { anchorScores } from './compose-score';
import {
  deriveRescanImprovement,
  isAnchoredVsJd,
} from './rescan-improvement';
import type { AnalyzeResponse } from '../../dto/analyze-response.dto';

/** Minimal payload the vs-JD composite can actually score. */
function payload(over: Partial<AnalyzeResponse> = {}): AnalyzeResponse {
  return {
    score: 0,
    verdict: 'Medium',
    breakdown: {
      keyword_match: 60,
      tech_stack_fit: 55,
      experience_level: 50,
      github_signal: 40,
      linkedin_signal: 45,
    },
    ats_simulation: { score: 70, threshold: 65, would_pass: true },
    hidden_red_flags: [],
    audit: { cv: { issues: [] }, github: { issues: [] }, linkedin: { issues: [] } },
    bullet_reviews: { bullets: [] },
    ...over,
  } as unknown as AnalyzeResponse;
}

/** The same payload with its score set to whatever the real formula produces. */
function anchored(over: Partial<AnalyzeResponse> = {}): AnalyzeResponse {
  return anchorScores(payload(over), null);
}

describe('isAnchoredVsJd', () => {
  it('accepts a score the formula reproduces', () => {
    expect(isAnchoredVsJd(anchored())).toBe(true);
  });

  it('rejects a raw model guess (the pre-anchor rows)', () => {
    const raw = anchored();
    // A headline the formula cannot produce from this payload.
    expect(isAnchoredVsJd({ ...raw, score: raw.score + 25 })).toBe(false);
  });

  it('rejects a CV audit, which has no vs-JD composite', () => {
    const cv = { ...anchored(), cv_quality: { overall: 55 } } as unknown as AnalyzeResponse;
    expect(isAnchoredVsJd(cv)).toBe(false);
  });

  it('is defensive against null and unscoreable payloads', () => {
    expect(isAnchoredVsJd(null)).toBe(false);
    expect(isAnchoredVsJd(undefined)).toBe(false);
    expect(isAnchoredVsJd({} as AnalyzeResponse)).toBe(false);
    // No ats_simulation: anchorScores would throw, which must not escape.
    expect(isAnchoredVsJd({ score: 40, breakdown: {} } as unknown as AnalyzeResponse)).toBe(false);
  });
});

describe('deriveRescanImprovement', () => {
  it('returns the parent risk when the re-scan genuinely lowered it', () => {
    const parent = anchored();
    // Better inputs across the board => lower risk.
    const child = anchored({
      breakdown: {
        keyword_match: 90,
        tech_stack_fit: 85,
        experience_level: 80,
        github_signal: 70,
        linkedin_signal: 75,
      },
      ats_simulation: { score: 90, threshold: 65, would_pass: true },
    } as Partial<AnalyzeResponse>);
    expect(child.score).toBeLessThan(parent.score);
    expect(deriveRescanImprovement(child, parent)).toBe(parent.score);
  });

  it('returns null when nothing improved', () => {
    const same = anchored();
    expect(deriveRescanImprovement(same, same)).toBeNull();
  });

  it('returns null when the re-scan made things worse', () => {
    const parent = anchored();
    const worse = anchored({
      breakdown: {
        keyword_match: 10,
        tech_stack_fit: 10,
        experience_level: 10,
        github_signal: 10,
        linkedin_signal: 10,
      },
    } as Partial<AnalyzeResponse>);
    expect(worse.score).toBeGreaterThan(parent.score);
    expect(deriveRescanImprovement(worse, parent)).toBeNull();
  });

  it('refuses to publish a gain measured against a PRE-ANCHOR parent', () => {
    // The regression that matters: a huge apparent win that is really just the
    // difference between a model guess and a computed score.
    const child = anchored({
      breakdown: {
        keyword_match: 90,
        tech_stack_fit: 85,
        experience_level: 80,
        github_signal: 70,
        linkedin_signal: 75,
      },
    } as Partial<AnalyzeResponse>);
    const legacyParent = { ...anchored(), score: 95 } as AnalyzeResponse; // unreproducible
    expect(child.score).toBeLessThan(95);
    expect(deriveRescanImprovement(child, legacyParent)).toBeNull();
  });

  it('returns null when there is no parent at all', () => {
    expect(deriveRescanImprovement(anchored(), null)).toBeNull();
  });
});
