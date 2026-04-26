import { z } from 'zod';

export const SubmitFirstSchema = z.object({
  challengeId: z.coerce.number().int().positive(),
  firstAnswer: z
    .string()
    .min(1, 'Answer is required')
    .max(10000, 'Answer is too long'),
});

export const SubmitFinalSchema = z.object({
  challengeId: z.coerce.number().int().positive(),
  secondAnswer: z
    .string()
    .min(1, 'Answer is required')
    .max(10000, 'Answer is too long'),
});

export const ChallengeIssueSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'major', 'minor']),
});

export type ChallengeIssue = z.infer<typeof ChallengeIssueSchema>;

export const GeneratedChallengeSchema = z.object({
  title: z.string().min(1),
  snippet: z.string().min(1),
  question: z.string().min(1),
  issues: z.array(ChallengeIssueSchema).min(1),
  estimatedTime: z.number().int().min(1).max(60),
});

export type GeneratedChallenge = z.infer<typeof GeneratedChallengeSchema>;

export const ScoreResultSchema = z.object({
  issues_found: z.number().min(0).max(40),
  explanation_quality: z.number().min(0).max(30),
  prioritization: z.number().min(0).max(20),
  bonus: z.number().min(0).max(10),
  total: z.number().min(0).max(100),
  feedback: z.string(),
  missed_issues: z.array(z.string()),
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
