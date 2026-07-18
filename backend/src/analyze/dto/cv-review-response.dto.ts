import { z } from 'zod';
import {
  CrossProfileInconsistencySchema,
  TimelineEntrySchema,
} from './profile-digest.dto';
import { BulletReviewsSchema, IssueHotSchema } from './analyze-response.dto';

// CV-review audit issues now carry an inline `fix` (tool requires it; DTO keeps
// it optional so pre-densification rows without a fix still replay).
const ReviewAuditIssueSchema = IssueHotSchema.extend({
  fix: z.string().optional(),
});

export const CvQualitySchema = z.object({
  overall: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  hard_skills: z.number().min(0).max(100),
  soft_skills: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
  ats_format: z.number().min(0).max(100),
});

export const ProjectedProfileSchema = z.object({
  seniority: z.string(),
  target_roles: z.array(z.string()).min(1).max(5),
  domains: z.array(z.string()).min(1).max(3),
  narrative: z.string(),
  profile_type: z.enum(['specialist', 'generalist', 'transitioning']),
});

export const SkillRadarSchema = z.object({
  axes: z
    .array(
      z.object({
        label: z.string(),
        score: z.number().min(0).max(100),
        // Expected level at the CLAIMED seniority. Optional so pre-migration
        // rows (generated before the axis carried it) still replay.
        expected: z.number().min(0).max(100).optional(),
        evidence: z.string(),
      }),
    )
    .min(4)
    .max(6),
});

const ExperienceSkillSchema = z.object({
  name: z.string(),
  status: z.enum(['proven', 'claimed']),
  // Null is mandatory when status is claimed (enforced by the prompt rules).
  evidence: z.string().nullable(),
});

/**
 * Per-role deep-dive entries (mirror of the experience_analysis tool block).
 * The 5-level finding severity is LOCAL to this block: global issue lists and
 * the scoring penalty keep their 3 levels and never read it.
 */
export const ExperienceAnalysisSchema = z
  .array(
    z.object({
      company: z.string(),
      title: z.string(),
      start: z.string().nullable(),
      end: z.string().nullable(),
      sources: z
        .array(z.enum(['cv', 'linkedin', 'github', 'portfolio']))
        .min(1),
      seniority_read: z.enum([
        'junior',
        'mid',
        'senior',
        'lead',
        'staff',
        'principal',
      ]),
      seniority_alignment: z.enum([
        'above_title',
        'matches_title',
        'below_title',
      ]),
      ratings: z.object({
        scope: z.number().int().min(1).max(5),
        ownership: z.number().int().min(1).max(5),
        impact: z.number().int().min(1).max(5),
      }),
      // Tool caps are 8 / 4 / 6: headroom so an off-by-one never fails.
      hard_skills: z.array(ExperienceSkillSchema).max(10),
      soft_skills: z.array(ExperienceSkillSchema).max(6),
      findings: z
        .array(
          z.object({
            severity: z.enum(['critical', 'major', 'medium', 'minor', 'info']),
            what: z.string(),
            why: z.string(),
          }),
        )
        .max(8),
      margin_note: z.string(),
    }),
  )
  // Tool cap is 8: headroom so an off-by-one never fails the review.
  .max(10);

export const PositioningGapsSchema = z.object({
  target_role: z.string(),
  gaps: z
    .array(
      z.object({
        what: z.string(),
        fix: z.string(),
      }),
    )
    .min(1)
    // Tool cap is 5 — one slot of headroom so an off-by-one never fails.
    .max(6),
});

export const CvQualityNotesSchema = z.object({
  clarity: z.string().optional(),
  impact: z.string().optional(),
  hard_skills: z.string().optional(),
  soft_skills: z.string().optional(),
  consistency: z.string().optional(),
  ats_format: z.string().optional(),
});

export const CvReviewResponseSchema = z.object({
  score: z.number().min(0).max(100),
  cv_quality: CvQualitySchema,
  cv_quality_notes: CvQualityNotesSchema.optional(),
  skill_radar: SkillRadarSchema.optional(),
  projected_profile: ProjectedProfileSchema,
  positioning_gaps: PositioningGapsSchema.optional(),
  ats_audit: z.object({
    score: z.number().min(0).max(100),
    issues: z
      .array(
        z.object({
          what: z.string(),
          why: z.string(),
          fix: z.string().optional(),
        }),
      )
      .max(5),
  }),
  seniority_analysis: z.object({
    expected: z.string(),
    detected: z.string(),
    // Optional so pre-densification DB rows (without evidence signals) still replay.
    detected_signals: z.array(z.string()).max(4).optional(),
    expected_signals: z.array(z.string()).max(4).optional(),
    gap: z.string(),
    strength: z.string(),
  }),
  cv_tone: z.object({
    detected: z.enum(['passive', 'active', 'mixed']),
    // Tool cap is 6 — headroom so an off-by-one never fails the review.
    examples: z.array(z.string()).max(8),
    rewrites: z.array(z.string()).max(8).optional(),
  }),
  // Optional so pre-densification DB rows replay.
  bullet_reviews: BulletReviewsSchema.optional(),
  // Optional so rows generated before the per-role deep-dive existed (and lean
  // owner audits, which drop it) still replay.
  experience_analysis: ExperienceAnalysisSchema.optional(),
  audit: z.object({
    cv: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(ReviewAuditIssueSchema),
      strengths: z.array(z.string()).optional(),
    }),
    github: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(ReviewAuditIssueSchema),
      strengths: z.array(z.string()).optional(),
    }),
    linkedin: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(ReviewAuditIssueSchema),
      strengths: z.array(z.string()).optional(),
    }),
  }),
  hidden_red_flags: z
    .array(
      z.object({
        flag: z.string(),
        perception: z.string(),
      }),
    )
    // Tool cap is 5 — headroom so an off-by-one never fails the review.
    .max(6),
  cross_profile_inconsistencies: z
    .array(CrossProfileInconsistencySchema)
    .optional(),
  timeline_entries: z.array(TimelineEntrySchema).optional(),
});

export type CvReviewResponse = z.infer<typeof CvReviewResponseSchema>;
