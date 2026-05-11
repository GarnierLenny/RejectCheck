import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NegotiationAnalysisSchema } from './negotiation-response.dto';
import { CrossProfileInconsistencySchema } from './profile-digest.dto';

export const FixSchema = z.object({
  summary: z.string(),
  steps: z.array(z.string()).min(1).max(5),
  example: z
    .object({
      before: z.string(),
      after: z.string(),
    })
    .nullable(),
  project_idea: z
    .object({
      name: z.string(),
      description: z.string(),
      endpoints: z.array(z.string()),
      bonus: z.string().nullable(),
      proves: z.string(),
    })
    .nullable(),
  time_required: z.string(),
});

// Issue without fix — used in the hot pass; fix is filled in from deep pass
// at merge time.
export const IssueHotSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  category: z.enum([
    'keywords',
    'impact',
    'seniority',
    'stack',
    'format',
    'tone',
    'consistency',
  ]),
  what: z.string(),
  why: z.string(),
});

// Full Issue (hot + fix). Used in the merged AnalyzeResponse.
export const IssueSchema = IssueHotSchema.extend({
  fix: FixSchema,
});

// Claude sometimes returns a string instead of an array — coerce gracefully
const strOrArr = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => (Array.isArray(v) ? v : [v]));

export const ProjectRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: strOrArr,
  key_features: strOrArr,
  architecture: z.string(),
  advanced_concepts: strOrArr,
  success_criteria: strOrArr,
  difficulty_level: z.enum(['Intermediate', 'Advanced', 'Expert']),
  why_it_matters: z.string(),
  what_matters: strOrArr,
});

export const ChallengeAnalysisSchema = z.object({
  status: z.enum(['cta', 'analyzed']),
  matched_language: z
    .enum(['typescript', 'python', 'java'])
    .nullable()
    .optional(),
  cta: z
    .object({
      language: z.string(),
      message: z.string(),
    })
    .nullable()
    .optional(),
  summary: z.string().nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  bridge_to_project: z.string().nullable().optional(),
});

export const TechnicalSkillSchema = z.object({
  name: z.string(),
  expected: z.number().min(0).max(10),
  current: z.number().min(0).max(10),
  evidence: z.string(),
});

export const TechnicalAnalysisSchema = z.object({
  reasoning: z.string(),
  skill_priority: z.array(z.string()).default([]),
  skills: z.array(TechnicalSkillSchema).length(5),
  recommendation: z.string(),
  market_context: z.string(),
  seniority_signals: z.array(z.string()),
});

export const AtsCriticalMissingKeywordSchema = z.object({
  keyword: z.string(),
  jd_frequency: z.number(),
  required: z.boolean(),
  sections_missing: z.array(z.string()),
  score_impact: z.number(),
});

const JobDetailsSchema = z.object({
  title: z.string(),
  company: z.string(),
  seniority: z
    .enum([
      'junior',
      'junior-mid',
      'mid',
      'mid-senior',
      'senior',
      'not-mentioned',
    ])
    .nullable()
    .default('not-mentioned'),
  pay: z.string().nullable().default(null),
  office_location: z.string().nullable().default(null),
  work_setting: z
    .enum(['full-remote', 'on-site', 'hybrid', 'not-mentioned'])
    .nullable()
    .default('not-mentioned'),
  contract_type: z
    .enum([
      'CDI',
      'CDD',
      'freelance',
      'internship',
      'apprenticeship',
      'not-mentioned',
    ])
    .nullable()
    .default('not-mentioned'),
  languages_required: z
    .enum(['french-only', 'english-only', 'bilingual', 'not-mentioned'])
    .nullable()
    .default('not-mentioned'),
  years_of_experience: z.string().nullable().default(null),
  company_stage: z
    .enum(['startup', 'scale-up', 'sme', 'enterprise', 'not-mentioned'])
    .nullable()
    .default('not-mentioned'),
  jd_language: z.string().default('en'),
});

const AuditJdMatchSchema = z.object({
  required_skills: z.array(
    z.object({
      skill: z.string(),
      found: z.boolean(),
      evidence: z.string().nullable(),
    }),
  ),
  experience_gap: z.string().nullable(),
});

// =============================================================================
// HOT pass schema — first response sent to the frontend (analysis_done event).
// Contains scores, audits without fixes, red flag titles, etc.
// =============================================================================

export const HotAnalyzeResponseSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['Low', 'Medium', 'High']),
  confidence: z.object({
    score: z.number().min(0).max(100),
    reason: z.string(),
  }),
  breakdown: z.object({
    keyword_match: z.number().min(0).max(100),
    tech_stack_fit: z.number().min(0).max(100),
    experience_level: z.number().min(0).max(100),
    github_signal: z.number().min(0).max(100).nullable(),
    linkedin_signal: z.number().min(0).max(100).nullable(),
  }),
  ats_simulation: z.object({
    would_pass: z.boolean(),
    score: z.number().min(0).max(100),
    threshold: z.number().min(0).max(100),
    reason: z.string(),
  }),
  seniority_analysis: z.object({
    expected: z.string(),
    detected: z.string(),
    gap: z.string(),
    strength: z.string(),
  }),
  cv_tone: z.object({
    detected: z.enum(['passive', 'active', 'mixed']),
    examples: z.array(z.string()).max(5),
  }),
  audit: z.object({
    cv: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(IssueHotSchema),
      strengths: z.array(z.string()).min(1).max(5),
    }),
    github: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(IssueHotSchema),
      strengths: z.array(z.string()),
    }),
    linkedin: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(IssueHotSchema),
      strengths: z.array(z.string()),
    }),
    jd_match: AuditJdMatchSchema,
  }),
  hidden_red_flags: z.array(
    z.object({
      flag: z.string(),
      perception: z.string(),
    }),
  ),
  correlation: z.object({
    detected: z.boolean(),
    explanation: z.string(),
  }),
  job_details: JobDetailsSchema,
  /**
   * Required for NEW analyses (Claude's hot tool schema marks it required),
   * but kept optional here so we can replay mid-format DB rows where the
   * field was still stored under `deepAnalysis`. The merge helper handles
   * the fallback.
   */
  technical_analysis: TechnicalAnalysisSchema.optional(),
  challenge_analysis: ChallengeAnalysisSchema.optional(),
});

// =============================================================================
// DEEP pass schema — second response, indexed to the hot pass output.
// Fix arrays MUST have the same length as their hot counterparts.
// =============================================================================

export const DeepAnalyzeResponseSchema = z.object({
  /**
   * Kept optional for backward compatibility: analyses created before
   * `technical_analysis` was moved into the hot pass stored it in this
   * field. The merge helper falls back to it when the hot result lacks
   * the field. New analyses won't populate this.
   */
  technical_analysis: TechnicalAnalysisSchema.optional(),
  project_recommendation: ProjectRecommendationSchema,
  ats_critical_missing_keywords: z.array(AtsCriticalMissingKeywordSchema),
  fixes: z.object({
    seniority_analysis: FixSchema,
    cv_tone: FixSchema,
    audit_cv_issues: z.array(FixSchema),
    audit_github_issues: z.array(FixSchema),
    audit_linkedin_issues: z.array(FixSchema),
    hidden_red_flags: z.array(FixSchema),
  }),
});

// =============================================================================
// Merged response — what the frontend ultimately consumes.
// Same shape as before the hot/deep split, for backward compatibility.
// =============================================================================

export const AnalyzeResponseSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['Low', 'Medium', 'High']),
  confidence: z.object({
    score: z.number().min(0).max(100),
    reason: z.string(),
  }),
  breakdown: z.object({
    keyword_match: z.number().min(0).max(100),
    tech_stack_fit: z.number().min(0).max(100),
    experience_level: z.number().min(0).max(100),
    github_signal: z.number().min(0).max(100).nullable(),
    linkedin_signal: z.number().min(0).max(100).nullable(),
  }),
  ats_simulation: z.object({
    would_pass: z.boolean(),
    score: z.number().min(0).max(100),
    threshold: z.number().min(0).max(100),
    reason: z.string(),
    critical_missing_keywords: z.array(AtsCriticalMissingKeywordSchema).optional(),
  }),
  seniority_analysis: z.object({
    expected: z.string(),
    detected: z.string(),
    gap: z.string(),
    strength: z.string(),
    fix: FixSchema.optional(),
  }),
  cv_tone: z.object({
    detected: z.enum(['passive', 'active', 'mixed']),
    examples: z.array(z.string()).max(5),
    fix: FixSchema.optional(),
  }),
  audit: z.object({
    cv: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(
        IssueHotSchema.extend({ fix: FixSchema.optional() }),
      ),
      strengths: z.array(z.string()).min(1).max(5),
    }),
    github: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(
        IssueHotSchema.extend({ fix: FixSchema.optional() }),
      ),
      strengths: z.array(z.string()),
    }),
    linkedin: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(
        IssueHotSchema.extend({ fix: FixSchema.optional() }),
      ),
      strengths: z.array(z.string()),
    }),
    jd_match: AuditJdMatchSchema,
  }),
  hidden_red_flags: z.array(
    z.object({
      flag: z.string(),
      perception: z.string(),
      fix: FixSchema.optional(),
    }),
  ),
  correlation: z.object({
    detected: z.boolean(),
    explanation: z.string(),
  }),
  job_details: JobDetailsSchema,
  project_recommendation: ProjectRecommendationSchema.optional(),
  challenge_analysis: ChallengeAnalysisSchema.optional(),
  technical_analysis: TechnicalAnalysisSchema.optional(),
  negotiation_analysis: NegotiationAnalysisSchema.nullable().optional(),
  /**
   * Pre-computed cross-profile inconsistencies from the user's ProfileDigest.
   * Surfaced in the analysis result so the frontend can render a dedicated
   * "Consistency check" section without re-fetching the digest.
   * Empty / undefined for anonymous users (no digest).
   */
  cross_profile_inconsistencies: z
    .array(CrossProfileInconsistencySchema)
    .optional(),
});

export class AnalyzeResponseDto extends createZodDto(AnalyzeResponseSchema) {}
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type HotAnalyzeResponse = z.infer<typeof HotAnalyzeResponseSchema>;
export type DeepAnalyzeResponse = z.infer<typeof DeepAnalyzeResponseSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type IssueHot = z.infer<typeof IssueHotSchema>;
export type Fix = z.infer<typeof FixSchema>;

/**
 * Merge hot pass + deep pass into the full AnalyzeResponse shape that the
 * frontend consumes. Re-injects `fix` blocks into their owners by index.
 *
 * If `deep` is null/undefined, returns the hot result with deep fields absent
 * — the frontend handles missing deep fields with skeleton placeholders.
 */
export function mergeHotAndDeep(
  hot: HotAnalyzeResponse,
  deep: DeepAnalyzeResponse | null | undefined,
): AnalyzeResponse {
  // `cross_profile_inconsistencies` isn't part of HotAnalyzeResponseSchema —
  // it's appended onto the result by AnalyzeCvUseCase after this merge runs
  // (sourced from the user's ProfileDigest). When GetAnalysisUseCase re-runs
  // this merge on a stored row, the field is present on the in-memory object
  // even though the Zod type doesn't list it. Preserve it through the merge
  // so reloading an analysis doesn't drop the Consistency tab data.
  const passthroughInconsistencies = (
    hot as unknown as { cross_profile_inconsistencies?: unknown }
  ).cross_profile_inconsistencies as
    | AnalyzeResponse['cross_profile_inconsistencies']
    | undefined;

  const merged: AnalyzeResponse = {
    score: hot.score,
    verdict: hot.verdict,
    confidence: hot.confidence,
    breakdown: hot.breakdown,
    ats_simulation: {
      ...hot.ats_simulation,
      // Leave undefined when deep hasn't arrived — the frontend uses this to
      // distinguish "loading the keyword list" from "no missing keywords".
      critical_missing_keywords: deep?.ats_critical_missing_keywords,
    },
    seniority_analysis: {
      ...hot.seniority_analysis,
      fix: deep?.fixes.seniority_analysis,
    },
    cv_tone: {
      ...hot.cv_tone,
      fix: deep?.fixes.cv_tone,
    },
    audit: {
      cv: {
        ...hot.audit.cv,
        issues: hot.audit.cv.issues.map((issue, i) => ({
          ...issue,
          fix: deep?.fixes.audit_cv_issues?.[i],
        })),
      },
      github: {
        ...hot.audit.github,
        issues: hot.audit.github.issues.map((issue, i) => ({
          ...issue,
          fix: deep?.fixes.audit_github_issues?.[i],
        })),
      },
      linkedin: {
        ...hot.audit.linkedin,
        issues: hot.audit.linkedin.issues.map((issue, i) => ({
          ...issue,
          fix: deep?.fixes.audit_linkedin_issues?.[i],
        })),
      },
      jd_match: hot.audit.jd_match,
    },
    hidden_red_flags: hot.hidden_red_flags.map((flag, i) => ({
      ...flag,
      fix: deep?.fixes.hidden_red_flags?.[i],
    })),
    correlation: hot.correlation,
    job_details: hot.job_details,
    challenge_analysis: hot.challenge_analysis,
    project_recommendation: deep?.project_recommendation,
    // technical_analysis lives in the hot pass for new analyses; fall back to
    // deep for analyses created before the move (mid-format DB rows).
    technical_analysis: hot.technical_analysis ?? deep?.technical_analysis,
  };
  if (passthroughInconsistencies && passthroughInconsistencies.length > 0) {
    merged.cross_profile_inconsistencies = passthroughInconsistencies;
  }
  return merged;
}
