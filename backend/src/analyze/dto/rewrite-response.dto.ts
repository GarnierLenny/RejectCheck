import { z } from 'zod';

export const RewriteResponseSchema = z.object({
  reconstructed_cv: z.string().min(100),
});

export type RewriteResponse = z.infer<typeof RewriteResponseSchema>;
