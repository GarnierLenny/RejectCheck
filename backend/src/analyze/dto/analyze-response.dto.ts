import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FixSchema = z.object({
  summary: z.string(),
  steps: z.array(z.string()).min(2).max(5),
  example: z.object({
    before: z.string(),
    after: z.string(),
  }).nullable(),
  project_idea: z.object({
    name: z.string(),
    description: z.string(),
    endpoints: z.array(z.string()),
    bonus: z.string().nullable(),
    proves: z.string(),
  }).nullable(),
  time_required: z.string(),
});

export const IssueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  category: z.enum(['keywords', 'impact', 'seniority', 'stack', 'format', 'tone', 'consistency']),
  what: z.string(),
  why: z.string(),
  fix: FixSchema,
});

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
    critical_missing_keywords: z.array(z.object({
      keyword: z.string(),
      jd_frequency: z.number(),
      required: z.boolean(),
      sections_missing: z.array(z.string()),
      score_impact: z.number(),
    })),
  }),
  seniority_analysis: z.object({
    expected: z.string(),
    detected: z.string(),
    gap: z.string(),
    strength: z.string(),
    fix: FixSchema,
  }),
  cv_tone: z.object({
    detected: z.enum(['passive', 'active', 'mixed']),
    examples: z.array(z.string()).max(5),
    fix: FixSchema,
  }),
  audit: z.object({
    cv: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(IssueSchema),
      strengths: z.array(z.string()).min(1).max(5),
    }),
    github: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(IssueSchema),
      strengths: z.array(z.string()),
    }),
    linkedin: z.object({
      score: z.number().min(0).max(100).nullable(),
      issues: z.array(IssueSchema),
      strengths: z.array(z.string()),
    }),
    jd_match: z.object({
      required_skills: z.array(z.object({
        skill: z.string(),
        found: z.boolean(),
        evidence: z.string().nullable(),
      })),
      experience_gap: z.string().nullable(),
    }),
  }),
  hidden_red_flags: z.array(z.object({
    flag: z.string(),
    perception: z.string(),
    fix: FixSchema,
  })),
  correlation: z.object({
    detected: z.boolean(),
    explanation: z.string(),
  }),
});

export class AnalyzeResponseDto extends createZodDto(AnalyzeResponseSchema) {}
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Fix = z.infer<typeof FixSchema>;
