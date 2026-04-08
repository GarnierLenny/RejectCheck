import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
  githubUsername: z.string().optional(),
});

export class AnalyzeRequestDto extends createZodDto(AnalyzeRequestSchema) {}
