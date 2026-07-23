import {
  stripFabricatedNumbers,
  sanitizeAnalyzeFabrication,
  sanitizeCvReviewFabrication,
} from './anti-fabrication';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';

describe('stripFabricatedNumbers', () => {
  const cv = 'Reduced latency by 40% across 3 services in 2023.';

  it('keeps numbers that appear in the source', () => {
    expect(stripFabricatedNumbers('Cut latency 40% for 3 services', cv)).toBe(
      'Cut latency 40% for 3 services',
    );
  });

  it('replaces fabricated numbers, preserving a trailing percent', () => {
    expect(stripFabricatedNumbers('Cut latency 60% and errors by 12', cv)).toBe(
      'Cut latency [X]% and errors by [X]',
    );
  });

  it('matches by value regardless of grouping/decimals', () => {
    const src = 'Managed a 1,200 person rollout.';
    expect(stripFabricatedNumbers('Led 1200 people', src)).toBe(
      'Led 1200 people',
    );
  });

  it('passes through empty / null unchanged', () => {
    expect(stripFabricatedNumbers(null, cv)).toBeNull();
    expect(stripFabricatedNumbers(undefined, cv)).toBeUndefined();
    expect(stripFabricatedNumbers('', cv)).toBe('');
  });
});

describe('sanitizeCvReviewFabrication', () => {
  it('scrubs bullet rewrites and tone rewrites in place', () => {
    const cv = 'Shipped a checkout flow used by many teams.';
    const result = {
      bullet_reviews: {
        bullets: [
          {
            original: 'Shipped a checkout flow',
            verdict: 'weak',
            rewrite: 'Shipped checkout lifting conversion 30%',
          },
        ],
      },
      cv_tone: {
        detected: 'passive',
        examples: ['was responsible for checkout'],
        rewrites: ['Owned checkout, cut drop-off 18%'],
      },
    } as unknown as CvReviewResponse;

    sanitizeCvReviewFabrication(result, cv);
    expect(result.bullet_reviews!.bullets[0].rewrite).toBe(
      'Shipped checkout lifting conversion [X]%',
    );
    expect(result.cv_tone.rewrites![0]).toBe(
      'Owned checkout, cut drop-off [X]%',
    );
  });

  it('leaves experience_analysis byte-identical, numbers included (D5 exemption)', () => {
    // The stripper protects paste-ready rewrites; the deep-dive fields are
    // analytic prose about the CV that legitimately carries derived counts
    // ("3 of 5 bullets", tenure arithmetic) with no verbatim counterpart in
    // the source. Machine-stripping would mutilate correct arithmetic, so the
    // guard is the prompt rule, not this sanitizer. See anti-fabrication.ts.
    const cv = 'Shipped a checkout flow used by many teams.';
    const experience = [
      {
        company: 'Acme',
        title: 'Engineer',
        start: '2021-01',
        end: '2022-03',
        sources: ['cv'],
        seniority_read: 'mid',
        seniority_alignment: 'matches_title',
        ratings: { scope: 3, ownership: 3, impact: 2 },
        hard_skills: [
          {
            name: 'Node.js',
            status: 'proven',
            evidence: 'Shipped checkout across 3 squads',
          },
        ],
        soft_skills: [],
        findings: [
          {
            severity: 'medium',
            what: '3 of 5 bullets have no outcome',
            why: '60% of the role reads unproven',
          },
        ],
        margin_note: '14 months of tenure, 0 quantified results.',
      },
    ];
    const result = {
      experience_analysis: experience,
    } as unknown as CvReviewResponse;
    const before = JSON.stringify(result.experience_analysis);

    sanitizeCvReviewFabrication(result, cv);
    expect(JSON.stringify(result.experience_analysis)).toBe(before);
  });
});

describe('sanitizeAnalyzeFabrication', () => {
  it('scrubs bullet rewrites and ATS insertions in place', () => {
    const cv = 'Built APIs in Node over 4 years.';
    const result = {
      bullet_reviews: {
        bullets: [
          {
            original: 'Built APIs',
            verdict: 'weak',
            rewrite: 'Built APIs serving 5M requests/day',
          },
        ],
      },
      ats_critical_missing_keywords: [
        {
          keyword: 'Kubernetes',
          jd_frequency: 3,
          required: true,
          sections_missing: [],
          score_impact: 5,
          insertion: {
            before: null,
            after: 'Deployed 12 microservices on Kubernetes',
          },
        },
      ],
    } as unknown as AnalyzeResponse;

    sanitizeAnalyzeFabrication(result, cv);
    expect(result.bullet_reviews!.bullets[0].rewrite).toBe(
      'Built APIs serving [X]M requests/day',
    );
    // ats_critical_missing_keywords lives on the merged/deep portion, not the
    // top-level AnalyzeResponse type — read it structurally, mirroring the fn.
    const ats = (
      result as unknown as {
        ats_critical_missing_keywords: Array<{ insertion: { after: string } }>;
      }
    ).ats_critical_missing_keywords;
    expect(ats[0].insertion.after).toBe(
      'Deployed [X] microservices on Kubernetes',
    );
  });
});
