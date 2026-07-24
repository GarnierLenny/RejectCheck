import {
  shapeAnalysisForPlan,
  shapeCvReviewForPlan,
  shapeSectionForPlan,
  shapeStoredResultForPlan,
} from './analysis-shaper';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';

const fix = (label: string) => ({
  summary: `SECRET_FIX ${label}`,
  steps: [`SECRET_FIX step ${label}`],
  example: { before: 'weak bullet', after: `SECRET_FIX after ${label}` },
  project_idea: null,
  time_required: '30 min',
});

const issue = (label: string) => ({
  severity: 'major' as const,
  category: 'impact' as const,
  what: `issue ${label}`,
  why: `why ${label}`,
  fix: fix(label),
});

function fullResult(): AnalyzeResponse {
  return {
    score: 62,
    verdict: 'Medium',
    confidence: { score: 80, reason: 'ok' },
    breakdown: {
      keyword_match: 70,
      tech_stack_fit: 60,
      experience_level: 55,
      github_signal: null,
      linkedin_signal: null,
    },
    ats_simulation: {
      would_pass: false,
      score: 55,
      threshold: 70,
      reason: 'missing keywords',
      critical_missing_keywords: Array.from({ length: 9 }, (_, i) => ({
        keyword: `kw${i}`,
        jd_frequency: 3,
        required: true,
        sections_missing: ['skills'],
        score_impact: 9 - i,
      })),
    },
    seniority_analysis: {
      expected: 'Senior',
      detected: 'Mid',
      gap: 'gap',
      strength: 'strength',
      fix: fix('seniority'),
    },
    cv_tone: {
      detected: 'passive',
      examples: ['participated in'],
      fix: fix('tone'),
    },
    audit: {
      cv: { score: 48, issues: [issue('cv1'), issue('cv2')] },
      github: { score: null, issues: [] },
      linkedin: { score: 60, issues: [issue('li1')] },
      jd_match: { required_skills: [], experience_gap: null },
    },
    hidden_red_flags: [{ flag: 'gap', perception: 'bad', fix: fix('flag') }],
    job_details: {
      title: 'Back-End Developer',
      company: 'Acme',
      seniority: 'senior',
      pay: null,
      office_location: null,
      work_setting: 'hybrid',
      contract_type: 'CDI',
      languages_required: 'bilingual',
      years_of_experience: null,
      company_stage: 'startup',
      jd_language: 'en',
    },
    bullet_reviews: {
      bullets: [
        {
          original: 'participated in the api',
          section: 'Experience — Acme',
          verdict: 'weak',
          flags: ['weak_verb'],
          why: 'no ownership',
          rewrite: 'SECRET_REWRITE owned the api',
        },
        {
          original: 'shipped payments serving 2M users',
          section: 'Experience — Acme',
          verdict: 'strong',
          flags: [],
          why: 'quantified',
          rewrite: null,
        },
      ],
    },
    project_recommendation: {
      name: 'GAP BRIDGE',
      description: 'a project',
      technologies: [{ name: 'NestJS', category: 'backend', reason: 'jd' }],
      key_features: ['SECRET_PROJECT feature'],
      architecture: 'SECRET_PROJECT arch',
      architecture_diagram: 'flowchart LR; A-->B',
      success_criteria: ['SECRET_PROJECT criteria'],
      difficulty_level: 'Intermediate',
      why_it_matters: 'matters',
      cv_bullet: 'SECRET_PROJECT bullet',
      signal_boost: 'SECRET_PROJECT boost',
      sections: [],
      edge_cases: [],
      going_further: [],
      how_to_sell: {
        github_readme_tip: 'SECRET_PROJECT tip',
        interview_pitch: 'SECRET_PROJECT pitch',
        star_tactics: 'SECRET_PROJECT stars',
      },
      interview_questions: [],
      testing_strategy: 'SECRET_PROJECT tests',
    },
    negotiation_analysis: {
      salary_range: 'SECRET_NEGO 50-60k',
    } as never,
  } as AnalyzeResponse;
}

const FREE = { premium: false, hired: false };
const SHORTLISTED = { premium: true, hired: false };
const HIRED = { premium: true, hired: true };

describe('shapeAnalysisForPlan', () => {
  it('free payload contains no fix, rewrite, full project or negotiation content', () => {
    const shaped = shapeAnalysisForPlan(fullResult(), FREE);
    const raw = JSON.stringify(shaped);
    expect(raw).not.toContain('SECRET_FIX');
    expect(raw).not.toContain('SECRET_REWRITE');
    expect(raw).not.toContain('SECRET_PROJECT');
    expect(raw).not.toContain('SECRET_NEGO');
  });

  it('free keeps the diagnostic teaser content', () => {
    const shaped = shapeAnalysisForPlan(fullResult(), FREE);
    expect(shaped.audit.cv.issues).toHaveLength(2);
    expect(shaped.audit.cv.issues[0].what).toBe('issue cv1');
    expect(shaped.hidden_red_flags[0].perception).toBe('bad');
    expect(shaped.bullet_reviews?.bullets[0].verdict).toBe('weak');
    expect(shaped.bullet_reviews?.bullets[0].rewrite).toBeNull();
    expect(shaped.ats_simulation.critical_missing_keywords).toHaveLength(3);
  });

  it('free fully locks the project — no content at all, not even a teaser', () => {
    const shaped = shapeAnalysisForPlan(fullResult(), FREE);
    // The whole object is omitted: no name, description, difficulty or why.
    expect(shaped.project_recommendation).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(shaped, 'project_recommendation')).toBe(false);
    const raw = JSON.stringify(shaped);
    expect(raw).not.toContain('GAP BRIDGE');
    expect(raw).not.toContain('a project');
    // ...but its existence is still advertised so the UI can show the unlock.
    expect(shaped.premium_locked?.project).toBe(true);
  });

  it('free payload carries premium_locked counts', () => {
    const shaped = shapeAnalysisForPlan(fullResult(), FREE);
    expect(shaped.premium_locked).toEqual({
      // 2 cv + 1 linkedin + 1 red flag + seniority + tone
      fixes: 6,
      bullet_rewrites: 1,
      ats_keywords: 6,
      project: true,
    });
  });

  it('does not mutate the stored result', () => {
    const original = fullResult();
    const before = JSON.stringify(original);
    shapeAnalysisForPlan(original, FREE);
    expect(JSON.stringify(original)).toBe(before);
  });

  it('shortlisted gets everything except negotiation', () => {
    const shaped = shapeAnalysisForPlan(fullResult(), SHORTLISTED);
    const raw = JSON.stringify(shaped);
    expect(raw).toContain('SECRET_FIX');
    expect(raw).toContain('SECRET_REWRITE');
    expect(raw).toContain('SECRET_PROJECT');
    expect(raw).not.toContain('SECRET_NEGO');
    expect(shaped.premium_locked).toBeUndefined();
  });

  it('hired gets the full payload including negotiation', () => {
    const raw = JSON.stringify(shapeAnalysisForPlan(fullResult(), HIRED));
    expect(raw).toContain('SECRET_NEGO');
  });

  it('handles pre-densification rows without bullet_reviews or project', () => {
    const result = fullResult();
    delete (result as Record<string, unknown>).bullet_reviews;
    delete (result as Record<string, unknown>).project_recommendation;
    const shaped = shapeAnalysisForPlan(result, FREE);
    expect(shaped.premium_locked).toMatchObject({
      bullet_rewrites: 0,
      project: false,
    });
  });
});

describe('shapeSectionForPlan', () => {
  it('agrees with shapeAnalysisForPlan on every redacted section', () => {
    const result = fullResult();
    const shaped = shapeAnalysisForPlan(result, FREE);

    expect(shapeSectionForPlan('audit_cv', result.audit.cv, FREE)).toEqual(
      shaped.audit.cv,
    );
    expect(
      shapeSectionForPlan(
        'seniority_analysis',
        result.seniority_analysis,
        FREE,
      ),
    ).toEqual(shaped.seniority_analysis);
    expect(
      shapeSectionForPlan('hidden_red_flags', result.hidden_red_flags, FREE),
    ).toEqual(shaped.hidden_red_flags);
    expect(
      shapeSectionForPlan('bullet_reviews', result.bullet_reviews, FREE),
    ).toEqual(shaped.bullet_reviews);
    expect(
      shapeSectionForPlan(
        'ats_critical_missing_keywords',
        result.ats_simulation.critical_missing_keywords,
        FREE,
      ),
    ).toEqual(shaped.ats_simulation.critical_missing_keywords);
    // The project is fully locked, so the two paths intentionally diverge:
    // the final payload OMITS the key, while the stream sends null to actively
    // clear any teaser the frontend may have optimistically rendered.
    expect(
      shapeSectionForPlan(
        'project_recommendation',
        result.project_recommendation,
        FREE,
      ),
    ).toBeNull();
    expect(shaped.project_recommendation).toBeUndefined();
  });

  it('passes premium sections through untouched', () => {
    const result = fullResult();
    expect(shapeSectionForPlan('audit_cv', result.audit.cv, SHORTLISTED)).toBe(
      result.audit.cv,
    );
    expect(shapeSectionForPlan('job_details', result.job_details, FREE)).toBe(
      result.job_details,
    );
  });
});

describe('shapeCvReviewForPlan', () => {
  const review = {
    score: 60,
    bullet_reviews: {
      bullets: [
        {
          original: 'helped with x',
          section: 'Experience',
          verdict: 'weak',
          flags: ['weak_verb'],
          why: 'vague',
          rewrite: 'SECRET_REWRITE drove x',
        },
      ],
    },
  } as never;

  it('nulls bullet rewrites for free users', () => {
    const shaped = shapeCvReviewForPlan(review, FREE);
    expect(JSON.stringify(shaped)).not.toContain('SECRET_REWRITE');
  });

  it('keeps rewrites for premium users', () => {
    const shaped = shapeCvReviewForPlan(review, SHORTLISTED);
    expect(JSON.stringify(shaped)).toContain('SECRET_REWRITE');
  });

  it('free: experience_analysis and radar expected pass through untouched, only rewrites nulled', () => {
    // The CV-audit redesign is all-free by product decision: the per-role
    // deep-dive and the expected calibration are never redacted. The only
    // premium content on a review remains the bullet rewrites.
    const experience = [
      {
        company: 'Acme',
        title: 'Engineer',
        start: '2021-01',
        end: 'present',
        sources: ['cv'],
        seniority_read: 'mid',
        seniority_alignment: 'matches_title',
        ratings: { scope: 3, ownership: 3, impact: 2 },
        hard_skills: [
          {
            name: 'Node.js',
            status: 'proven',
            evidence: 'Shipped checkout in Node',
          },
        ],
        soft_skills: [{ name: 'Mentoring', status: 'claimed', evidence: null }],
        findings: [
          {
            severity: 'info',
            what: 'Checkout is a strong anchor',
            why: 'Lead with it',
          },
        ],
        margin_note: 'Owns things, proves little.',
      },
    ];
    const radar = {
      axes: [{ label: 'Backend', score: 70, expected: 75, evidence: 'ok' }],
    };
    const fullReview = {
      ...(review as Record<string, unknown>),
      experience_analysis: experience,
      skill_radar: radar,
    } as never;

    const shaped = shapeCvReviewForPlan(fullReview, FREE) as unknown as {
      experience_analysis: unknown;
      skill_radar: unknown;
      bullet_reviews: { bullets: Array<{ rewrite: unknown }> };
    };
    // Same reference: shaping never clones or redacts the new sections.
    expect(shaped.experience_analysis).toBe(experience);
    expect(shaped.skill_radar).toBe(radar);
    expect(shaped.bullet_reviews.bullets[0].rewrite).toBeNull();
  });

  it('streams experience_analysis unshaped for free users (shapeSectionForPlan passthrough)', () => {
    const value = [{ company: 'Acme', findings: [] }];
    expect(shapeSectionForPlan('experience_analysis', value, FREE)).toBe(value);
  });
});

describe('shapeStoredResultForPlan', () => {
  it('dispatches CV-review rows (cv_quality present) without throwing on the vs-JD shape', () => {
    const reviewRow = {
      score: 60,
      cv_quality: { overall: 60 },
      bullet_reviews: {
        bullets: [
          {
            original: 'helped with x',
            section: 'Experience',
            verdict: 'weak',
            flags: [],
            why: 'vague',
            rewrite: 'SECRET_REWRITE drove x',
          },
        ],
      },
    };
    const shaped = shapeStoredResultForPlan(reviewRow as never, FREE);
    expect(JSON.stringify(shaped)).not.toContain('SECRET_REWRITE');
  });

  it('shapes vs-JD rows through shapeAnalysisForPlan', () => {
    const shaped = shapeStoredResultForPlan(fullResult() as never, FREE);
    expect(JSON.stringify(shaped)).not.toContain('SECRET_FIX');
  });

  it('never throws on partial legacy rows', () => {
    const partial = {
      score: 50,
      verdict: 'Medium',
      seniority_analysis: {
        expected: 'a',
        detected: 'b',
        gap: 'c',
        strength: 'd',
      },
      cv_tone: { detected: 'mixed', examples: [] },
    };
    expect(() =>
      shapeStoredResultForPlan(partial as never, FREE),
    ).not.toThrow();
  });
});
