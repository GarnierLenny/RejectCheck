import { z } from 'zod';

export const AnalyzeResponseSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['Low', 'Medium', 'High']),
  top_reasons: z.array(z.string()).length(3),
  improvements: z.array(z.string()).length(3),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
