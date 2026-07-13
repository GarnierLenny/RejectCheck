import { computeDeltas } from './rescan-delta';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';

/**
 * Minimal AnalyzeResponse-shaped fixture. computeDeltas only reads score,
 * breakdown, ats_simulation and audit.*.issues, so we build just those and cast.
 */
function make(overrides: {
  score?: number;
  breakdown?: Partial<AnalyzeResponse['breakdown']>;
  ats?: { would_pass?: boolean; score?: number };
  cvIssues?: Array<{ id?: string; what?: string }>;
}): AnalyzeResponse {
  return {
    score: overrides.score ?? 50,
    breakdown: {
      keyword_match: 50,
      tech_stack_fit: 50,
      experience_level: 50,
      github_signal: null,
      linkedin_signal: null,
      ...overrides.breakdown,
    },
    ats_simulation: {
      would_pass: overrides.ats?.would_pass ?? false,
      score: overrides.ats?.score ?? 50,
      threshold: 70,
      reason: '',
    },
    audit: {
      cv: { score: 50, issues: overrides.cvIssues ?? [] },
      github: { score: null, issues: [] },
      linkedin: { score: null, issues: [] },
      jd_match: { required_skills: [], experience_gap: null },
    },
  } as unknown as AnalyzeResponse;
}

describe('computeDeltas', () => {
  it('computes the overall score movement', () => {
    const d = computeDeltas(make({ score: 42 }), make({ score: 68 }));
    expect(d.score).toEqual({ before: 42, after: 68, delta: 26 });
  });

  it('computes per-dimension breakdown deltas', () => {
    const before = make({ breakdown: { keyword_match: 40, tech_stack_fit: 60 } });
    const after = make({ breakdown: { keyword_match: 75, tech_stack_fit: 55 } });
    const d = computeDeltas(before, after);
    expect(d.breakdown.keyword_match).toEqual({ before: 40, after: 75, delta: 35 });
    expect(d.breakdown.tech_stack_fit).toEqual({ before: 60, after: 55, delta: -5 });
  });

  it('returns a null delta when one side of a nullable dimension is missing', () => {
    const before = make({ breakdown: { github_signal: null } });
    const after = make({ breakdown: { github_signal: 80 } });
    const d = computeDeltas(before, after);
    expect(d.breakdown.github_signal).toEqual({ before: null, after: 80, delta: null });
  });

  it('surfaces the ATS pass flag flipping', () => {
    const before = make({ ats: { would_pass: false, score: 55 } });
    const after = make({ ats: { would_pass: true, score: 78 } });
    const d = computeDeltas(before, after);
    expect(d.ats).toEqual({
      wouldPassBefore: false,
      wouldPassAfter: true,
      scoreBefore: 55,
      scoreAfter: 78,
    });
  });

  it('counts resolved and new issues by stable id', () => {
    const before = make({
      cvIssues: [{ id: 'cv-a' }, { id: 'cv-b' }, { id: 'cv-c' }],
    });
    const after = make({
      cvIssues: [{ id: 'cv-b' }, { id: 'cv-d' }], // a & c resolved, d is new
    });
    const d = computeDeltas(before, after);
    expect(d.resolvedIssueCount).toBe(2);
    expect(d.newIssueCount).toBe(1);
  });

  it('falls back to the `what` text when issues lack stable ids (legacy rows)', () => {
    const before = make({ cvIssues: [{ what: 'No metrics on bullet 3' }] });
    const after = make({ cvIssues: [] });
    const d = computeDeltas(before, after);
    expect(d.resolvedIssueCount).toBe(1);
  });

  it('threads deterministic keyword coverage through', () => {
    const d = computeDeltas(make({}), make({}), {
      coverageBefore: 45,
      coverageAfter: 72,
    });
    expect(d.keywordCoverage).toEqual({ before: 45, after: 72, delta: 27 });
  });
});
