import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  jobDescription: z
    .string()
    .min(1, 'Job description is required')
    .max(20000, 'Job description is too long'),
  githubUsername: z.string().max(39, 'GitHub username is too long').optional(),
  motivationLetterText: z
    .string()
    .max(20000, 'Motivation letter is too long')
    .optional(),
  email: z.string().email().optional(),
  isRegistered: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
  locale: z.enum(['en', 'fr']).optional().default('en'),
});

export class AnalyzeRequestDto extends createZodDto(AnalyzeRequestSchema) {}
