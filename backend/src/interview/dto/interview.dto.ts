import { z } from 'zod';

export const StartInterviewSchema = z.object({
  analysisId: z.coerce.number().int().positive(),
  email: z.string().email(),
});

export const AnswerSchema = z.object({
  interviewId: z.coerce.number().int().positive(),
  email: z.string().email(),
  questionIndex: z.coerce.number().int().min(0),
});

export const CompleteSchema = z.object({
  interviewId: z.coerce.number().int().positive(),
  email: z.string().email(),
});

export const TranscriptEntrySchema = z.object({
  role: z.enum(['ai', 'user', 'meta']),
  content: z.string(),
  questionIndex: z.number().int(),
});

export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;

export const InterviewAnalysisSchema = z.object({
  axes: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(10),
      feedback: z.string(),
    }),
  ),
  questionFeedback: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      verdict: z.enum(['good', 'average', 'poor']),
      comment: z.string(),
    }),
  ),
  globalVerdict: z.string(),
  keyStrengths: z.array(z.string()),
  keyImprovements: z.array(z.string()),
});

export type InterviewAnalysis = z.infer<typeof InterviewAnalysisSchema>;
