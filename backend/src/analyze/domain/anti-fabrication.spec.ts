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
    expect(
      stripFabricatedNumbers('Cut latency 60% and errors by 12', cv),
    ).toBe('Cut latency [X]% and errors by [X]');
  });

  it('matches by value regardless of grouping/decimals', () => {
    const src = 'Managed a 1,200 person rollout.';
    expect(stripFabricatedNumbers('Led 1200 people', src)).toBe('Led 1200 people');
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
          { original: 'Shipped a checkout flow', verdict: 'weak', rewrite: 'Shipped checkout lifting conversion 30%' },
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
    expect(result.cv_tone!.rewrites![0]).toBe('Owned checkout, cut drop-off [X]%');
  });
});

describe('sanitizeAnalyzeFabrication', () => {
  it('scrubs bullet rewrites and ATS insertions in place', () => {
    const cv = 'Built APIs in Node over 4 years.';
    const result = {
      bullet_reviews: {
        bullets: [
          { original: 'Built APIs', verdict: 'weak', rewrite: 'Built APIs serving 5M requests/day' },
        ],
      },
      ats_critical_missing_keywords: [
        {
          keyword: 'Kubernetes',
          jd_frequency: 3,
          required: true,
          sections_missing: [],
          score_impact: 5,
          insertion: { before: null, after: 'Deployed 12 microservices on Kubernetes' },
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
