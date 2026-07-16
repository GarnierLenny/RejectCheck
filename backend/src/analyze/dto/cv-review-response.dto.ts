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
        evidence: z.string(),
      }),
    )
    .min(4)
    .max(6),
});

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
