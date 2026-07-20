import { buildAnalysisTool } from './claude-analysis.schema';
import { buildCvReviewTool, SUBMIT_CV_REVIEW_TOOL } from './cv-review.schema';

describe('buildAnalysisTool — lean (owner audit mode)', () => {
  const full = buildAnalysisTool(true, false).input_schema;
  const lean = buildAnalysisTool(true, true).input_schema;

  const ACTIONABLE = [
    'bullet_reviews',
    'ats_critical_missing_keywords',
    'highlight_terms',
    'project_recommendation',
  ];

  it('full pass includes the actionable properties', () => {
    for (const k of ACTIONABLE) expect(full.properties).toHaveProperty(k);
  });

  it('lean pass drops every actionable property and requirement', () => {
    for (const k of ACTIONABLE) {
      expect(lean.properties).not.toHaveProperty(k);
      expect(lean.required).not.toContain(k);
    }
  });

  it('lean audits and diagnostics carry no fix field', () => {
    const auditCv = lean.properties.audit_cv as {
      properties: { issues: { items: { properties: Record<string, unknown>; required: string[] } } };
    };
    expect(auditCv.properties.issues.items.properties).not.toHaveProperty('fix');
    expect(auditCv.properties.issues.items.required).not.toContain('fix');

    const seniority = lean.properties.seniority_analysis as {
      properties: Record<string, unknown>;
      required: string[];
    };
    expect(seniority.properties).not.toHaveProperty('fix');
    expect(seniority.required).not.toContain('fix');
  });

  it('lean pass keeps the full diagnostic', () => {
    for (const k of [
      'job_details',
      'overall',
      'carousel_insights',
      'ats_simulation',
      'audit_jd_match',
      'seniority_analysis',
      'technical_analysis',
      'cv_tone',
      'audit_cv',
      'hidden_red_flags',
    ]) {
      expect(lean.properties).toHaveProperty(k);
      expect(lean.required).toContain(k);
    }
  });
});

describe('buildCvReviewTool — lean', () => {
  it('non-lean returns the full tool with bullet_reviews', () => {
    expect(buildCvReviewTool(false)).toBe(SUBMIT_CV_REVIEW_TOOL);
    expect(
      buildCvReviewTool(false).input_schema.properties,
    ).toHaveProperty('bullet_reviews');
  });

  it('lean drops bullet_reviews from properties and required', () => {
    const lean = buildCvReviewTool(true).input_schema;
    expect(lean.properties).not.toHaveProperty('bullet_reviews');
    expect(lean.required).not.toContain('bullet_reviews');
    // still a full review otherwise
    expect(lean.properties).toHaveProperty('cv_quality');
    expect(lean.required).toContain('audit_cv');
  });
});
