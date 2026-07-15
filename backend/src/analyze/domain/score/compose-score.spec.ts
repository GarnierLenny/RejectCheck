import type { AnalyzeResponse } from '../../dto/analyze-response.dto';
import {
  QUANT_STEP,
  quantize,
  deriveVerdict,
  composeRisk,
  anchorBreakdown,
  anchorScores,
  type AnchoredBreakdown,
} from './compose-score';

const fullBreakdown = (
  over: Partial<AnchoredBreakdown> = {},
): AnchoredBreakdown => ({
  keyword_match: 100,
  tech_stack_fit: 100,
  experience_level: 100,
  github_signal: 100,
  linkedin_signal: 100,
  ...over,
});

describe('quantize', () => {
  it('rounds to the nearest QUANT_STEP', () => {
    expect(QUANT_STEP).toBe(5);
    expect(quantize(12)).toBe(10);
    expect(quantize(13)).toBe(15);
    expect(quantize(42)).toBe(40);
    expect(quantize(43)).toBe(45);
  });

  it('clamps out-of-range inputs', () => {
    expect(quantize(-3)).toBe(0);
    expect(quantize(103)).toBe(100);
  });

  it('is idempotent on already-quantized values', () => {
    for (const v of [0, 5, 40, 65, 100]) expect(quantize(v)).toBe(v);
  });
});

describe('deriveVerdict', () => {
  it('bands risk into Low / Medium / High', () => {
    expect(deriveVerdict(0)).toBe('Low');
    expect(deriveVerdict(30)).toBe('Low');
    expect(deriveVerdict(35)).toBe('Medium');
    expect(deriveVerdict(64)).toBe('Medium');
    expect(deriveVerdict(65)).toBe('High');
    expect(deriveVerdict(100)).toBe('High');
  });
});

describe('composeRisk', () => {
  const noPenalties = {
    redFlagCount: 0,
    criticalIssueCount: 0,
    fatalBulletCount: 0,
  };

  it('gives 0 risk for a perfect match with no penalties', () => {
    expect(
      composeRisk({
        breakdown: fullBreakdown(),
        atsScore: 100,
        ...noPenalties,
      }),
    ).toBe(0);
  });

  it('gives 100 risk for a zero match with no penalties', () => {
    expect(
      composeRisk({
        breakdown: fullBreakdown({
          keyword_match: 0,
          tech_stack_fit: 0,
          experience_level: 0,
          github_signal: 0,
          linkedin_signal: 0,
        }),
        atsScore: 0,
        ...noPenalties,
      }),
    ).toBe(100);
  });

  it('renormalises weights when github/linkedin are absent', () => {
    // fit = (80*.3 + 60*.25 + 40*.2 + 50*.1) / .85 = 52 / .85 = 61.18
    // risk = quantize(100 - 61.18) = quantize(38.82) = 40
    expect(
      composeRisk({
        breakdown: fullBreakdown({
          keyword_match: 80,
          tech_stack_fit: 60,
          experience_level: 40,
          github_signal: null,
          linkedin_signal: null,
        }),
        atsScore: 50,
        ...noPenalties,
      }),
    ).toBe(40);
  });

  it('adds capped penalties for hard rejection signals', () => {
    // Same fit (40 base risk) + penalties: redflags 3*4=12 (cap 12),
    // critical 2*3=6, fatal 1*2=2 => +20 => quantize(58.82) = 60
    expect(
      composeRisk({
        breakdown: fullBreakdown({
          keyword_match: 80,
          tech_stack_fit: 60,
          experience_level: 40,
          github_signal: null,
          linkedin_signal: null,
        }),
        atsScore: 50,
        redFlagCount: 3,
        criticalIssueCount: 2,
        fatalBulletCount: 1,
      }),
    ).toBe(60);
  });

  it('caps each penalty so a noisy list cannot dominate', () => {
    const capped = composeRisk({
      breakdown: fullBreakdown(),
      atsScore: 100,
      redFlagCount: 99,
      criticalIssueCount: 99,
      fatalBulletCount: 99,
    });
    // perfect fit (risk 0) + 12 + 9 + 8 = 29 => quantize(29) = 30
    expect(capped).toBe(30);
  });

  it('is monotonic: more missing coverage never lowers risk', () => {
    const base = composeRisk({
      breakdown: fullBreakdown({ keyword_match: 80 }),
      atsScore: 80,
      ...noPenalties,
    });
    const worse = composeRisk({
      breakdown: fullBreakdown({ keyword_match: 40 }),
      atsScore: 80,
      ...noPenalties,
    });
    expect(worse).toBeGreaterThanOrEqual(base);
  });
});

describe('anchorBreakdown', () => {
  const raw = {
    keyword_match: 47,
    tech_stack_fit: 63,
    experience_level: 41,
    github_signal: 58,
    linkedin_signal: null as number | null,
  };

  it('replaces keyword_match with the deterministic coverage (exact)', () => {
    expect(anchorBreakdown(raw, 73).keyword_match).toBe(73);
  });

  it('falls back to the quantized LLM value when coverage is null', () => {
    expect(anchorBreakdown(raw, null).keyword_match).toBe(quantize(47));
  });

  it('quantizes the LLM sub-scores and preserves nulls', () => {
    const out = anchorBreakdown(raw, 73);
    expect(out.tech_stack_fit).toBe(65);
    expect(out.experience_level).toBe(40);
    expect(out.github_signal).toBe(60);
    expect(out.linkedin_signal).toBeNull();
  });
});

describe('anchorScores', () => {
  const makeResult = (over: Partial<AnalyzeResponse> = {}): AnalyzeResponse =>
    ({
      score: 12,
      verdict: 'Low',
      breakdown: {
        keyword_match: 90,
        tech_stack_fit: 62,
        experience_level: 44,
        github_signal: 58,
        linkedin_signal: null,
      },
      ats_simulation: {
        would_pass: true,
        score: 61,
        threshold: 65,
        reason: 'x',
      },
      hidden_red_flags: [],
      audit: { cv: { score: 70, issues: [] } },
      ...over,
    }) as unknown as AnalyzeResponse;

  it('overrides the displayed keyword_match with the deterministic coverage', () => {
    const out = anchorScores(makeResult(), 55);
    expect(out.breakdown.keyword_match).toBe(55);
  });

  it('re-derives ats would_pass from the quantized score', () => {
    // quantize(61) = 60 < threshold 65 => would_pass false, despite the model
    // asserting true.
    const out = anchorScores(makeResult(), 55);
    expect(out.ats_simulation.score).toBe(60);
    expect(out.ats_simulation.would_pass).toBe(false);
  });

  it('recomputes the headline risk and verdict from the parts', () => {
    const out = anchorScores(makeResult(), 55);
    expect(out.verdict).toBe(deriveVerdict(out.score));
    // The model claimed score 12 / Low; the composite must ignore that.
    expect(out.score).not.toBe(12);
  });

  it('pushes risk up when hard rejection signals are present', () => {
    const clean = anchorScores(makeResult(), 55).score;
    const flagged = anchorScores(
      makeResult({
        hidden_red_flags: [
          { flag: 'a', perception: 'x' },
          { flag: 'b', perception: 'y' },
        ],
        audit: {
          cv: {
            score: 40,
            issues: [
              { severity: 'critical', category: 'impact', what: 'x', why: 'y' },
            ],
          },
        },
        bullet_reviews: {
          bullets: [{ verdict: 'fatal' }, { verdict: 'strong' }],
        },
      } as unknown as Partial<AnalyzeResponse>),
      55,
    ).score;
    expect(flagged).toBeGreaterThan(clean);
  });

  it('does not mutate the input', () => {
    const input = makeResult();
    const snapshot = JSON.stringify(input);
    anchorScores(input, 55);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('is stable across repeated runs (same input, same output)', () => {
    const a = anchorScores(makeResult(), 55);
    const b = anchorScores(makeResult(), 55);
    expect(a).toEqual(b);
  });
});
