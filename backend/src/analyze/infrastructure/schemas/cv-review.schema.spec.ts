import { buildCvReviewTool, SUBMIT_CV_REVIEW_TOOL } from './cv-review.schema';

/**
 * Pins the cv-review tool surface after the experience_analysis addition:
 * the full tool's exact key order (the model generates sections in property
 * order, so order IS the streaming order), and the lean (owner audit) variant
 * dropping BOTH token-heavy blocks.
 */
describe('SUBMIT_CV_REVIEW_TOOL: shape', () => {
  const FULL_KEYS = [
    'carousel_insights',
    'cv_quality',
    'cv_quality_notes',
    'projected_profile',
    'skill_radar',
    'positioning_gaps',
    'ats_audit',
    'seniority_analysis',
    'cv_tone',
    'bullet_reviews',
    'experience_analysis',
    'audit_cv',
    'audit_github',
    'audit_linkedin',
    'timeline_entries',
    'cross_profile_inconsistencies',
    'hidden_red_flags',
  ];

  it('full tool has exactly 17 ordered keys, with the carousel brief generated first', () => {
    const keys = Object.keys(SUBMIT_CV_REVIEW_TOOL.input_schema.properties);
    expect(keys).toEqual(FULL_KEYS);
    expect(keys).toHaveLength(17);
    expect(keys[0]).toBe('carousel_insights');
  });

  it('every property is required on the full tool', () => {
    const { required } = SUBMIT_CV_REVIEW_TOOL.input_schema;
    expect([...required].sort()).toEqual([...FULL_KEYS].sort());
    expect(required).toContain('experience_analysis');
  });

  it('skill_radar axes require expected (0-100)', () => {
    const axes = (
      SUBMIT_CV_REVIEW_TOOL.input_schema.properties.skill_radar as {
        properties: {
          axes: {
            items: {
              properties: Record<string, { minimum?: number; maximum?: number }>;
              required: string[];
            };
          };
        };
      }
    ).properties.axes;
    expect(axes.items.required).toContain('expected');
    expect(axes.items.properties.expected).toMatchObject({
      minimum: 0,
      maximum: 100,
    });
  });

  it('timeline_entries no longer gates on 2+ sources (CV-only populates)', () => {
    const desc = (
      SUBMIT_CV_REVIEW_TOOL.input_schema.properties.timeline_entries as {
        description: string;
      }
    ).description;
    expect(desc).toContain('ALWAYS populate');
    expect(desc).toContain('one entry per CV role');
    expect(desc).not.toContain('Empty array if only CV is present');
  });

  it('carousel brief uses a six-slide script and a 0-10 scorecard', () => {
    const carousel = SUBMIT_CV_REVIEW_TOOL.input_schema.properties
      .carousel_insights as {
      properties: {
        scorecard: { minItems: number; maxItems: number; items: { properties: { score: { minimum: number; maximum: number } } } };
        slides: { minItems: number; maxItems: number };
      };
    };
    expect(carousel.properties.scorecard).toMatchObject({ minItems: 6, maxItems: 8 });
    expect(carousel.properties.scorecard.items.properties.score).toMatchObject({ minimum: 0, maximum: 10 });
    expect(carousel.properties.slides).toMatchObject({ minItems: 6, maxItems: 6 });
  });
});

describe('buildCvReviewTool: lean drops both token-heavy blocks', () => {
  it('non-lean returns the full tool untouched', () => {
    expect(buildCvReviewTool(false)).toBe(SUBMIT_CV_REVIEW_TOOL);
  });

  it('lean drops bullet_reviews AND experience_analysis from properties and required', () => {
    const lean = buildCvReviewTool(true).input_schema;
    for (const k of ['bullet_reviews', 'experience_analysis']) {
      expect(lean.properties).not.toHaveProperty(k);
      expect(lean.required).not.toContain(k);
    }
    // Still a full review otherwise: 15 keys, including the carousel brief.
    expect(Object.keys(lean.properties)).toHaveLength(15);
    expect(lean.properties).toHaveProperty('carousel_insights');
    expect(lean.properties).toHaveProperty('audit_cv');
    expect(lean.required).toContain('timeline_entries');
  });
});
