/**
 * Integration guard for the section-streaming glue used by AnalyzeCvUseCase:
 * SectionStreamParser feeds each completed top-level property through the
 * breakdown-buffering + shapeSectionForPlan wiring, and the emitted events
 * must (a) come out in schema order, (b) collapse the 5 breakdown scalars
 * into one `breakdown` event, and (c) be plan-shaped (free = no fixes/rewrites).
 */
import { SectionStreamParser } from './section-stream.parser';
import { shapeSectionForPlan } from '../domain/analysis-shaper';

const BREAKDOWN_KEYS = [
  'keyword_match',
  'experience_level',
  'tech_stack_fit',
  'github_signal',
  'linkedin_signal',
];

// Replicates the onSection wiring in analyze-cv.use-case.ts.
function runPipeline(json: string, ctx: { premium: boolean; hired: boolean }) {
  const events: Array<{ key: string; value: unknown }> = [];
  const breakdownBuffer: Record<string, unknown> = {};
  const parser = new SectionStreamParser({
    onSection: (key, value) => {
      if (BREAKDOWN_KEYS.includes(key)) {
        breakdownBuffer[key] = value;
        if (key === 'linkedin_signal') {
          events.push({ key: 'breakdown', value: { ...breakdownBuffer } });
        }
        return;
      }
      events.push({ key, value: shapeSectionForPlan(key, value, ctx) });
    },
  });
  // Feed in small chunks to exercise the incremental parser.
  for (let i = 0; i < json.length; i += 5) parser.push(json.slice(i, i + 5));
  return events;
}

const FIX = {
  summary: 'SECRET',
  steps: ['SECRET'],
  example: null,
  project_idea: null,
  time_required: '30 min',
};

const ANALYSIS = JSON.stringify({
  job_details: { title: 'Back-End Developer', company: 'Acme' },
  overall: { score: 62, verdict: 'Medium', confidence: { score: 80, reason: 'ok' } },
  keyword_match: 70,
  experience_level: 55,
  tech_stack_fit: 60,
  github_signal: null,
  linkedin_signal: null,
  ats_simulation: { would_pass: false, score: 55, threshold: 70, reason: 'x' },
  audit_cv: {
    score: 48,
    issues: [{ severity: 'major', category: 'impact', what: 'w', why: 'y', fix: FIX }],
  },
  hidden_red_flags: [{ flag: 'gap', perception: 'bad', fix: FIX }],
  bullet_reviews: {
    bullets: [
      { original: 'helped with x', section: 'Exp', verdict: 'weak', flags: [], why: 'vague', rewrite: 'SECRET' },
    ],
  },
  ats_critical_missing_keywords: [
    { keyword: 'k1', jd_frequency: 3, required: true, sections_missing: [], score_impact: 5 },
    { keyword: 'k2', jd_frequency: 2, required: true, sections_missing: [], score_impact: 4 },
    { keyword: 'k3', jd_frequency: 2, required: true, sections_missing: [], score_impact: 3 },
    { keyword: 'k4', jd_frequency: 1, required: false, sections_missing: [], score_impact: 2 },
  ],
});

describe('section-stream integration (use-case wiring)', () => {
  it('emits sections in schema order with a single collapsed breakdown', () => {
    const keys = runPipeline(ANALYSIS, { premium: true, hired: true }).map(
      (e) => e.key,
    );
    expect(keys).toEqual([
      'job_details',
      'overall',
      'breakdown',
      'ats_simulation',
      'audit_cv',
      'hidden_red_flags',
      'bullet_reviews',
      'ats_critical_missing_keywords',
    ]);
    const breakdown = runPipeline(ANALYSIS, { premium: true, hired: true }).find(
      (e) => e.key === 'breakdown',
    )!.value as Record<string, unknown>;
    expect(breakdown).toEqual({
      keyword_match: 70,
      experience_level: 55,
      tech_stack_fit: 60,
      github_signal: null,
      linkedin_signal: null,
    });
  });

  it('free plan: no fix/rewrite leaks and ATS keywords are capped to 3', () => {
    const events = runPipeline(ANALYSIS, { premium: false, hired: false });
    expect(JSON.stringify(events)).not.toContain('SECRET');

    const ats = events.find((e) => e.key === 'ats_critical_missing_keywords')!
      .value as unknown[];
    expect(ats).toHaveLength(3);

    const bullets = (events.find((e) => e.key === 'bullet_reviews')!.value as {
      bullets: Array<{ rewrite: unknown; verdict: string }>;
    }).bullets;
    expect(bullets[0].rewrite).toBeNull();
    expect(bullets[0].verdict).toBe('weak'); // diagnostic teaser preserved
  });

  it('premium plan: fixes and rewrites pass through untouched', () => {
    const events = runPipeline(ANALYSIS, { premium: true, hired: false });
    expect(JSON.stringify(events)).toContain('SECRET');
  });
});
