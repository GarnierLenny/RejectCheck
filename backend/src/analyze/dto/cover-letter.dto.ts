import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CoverLetterSchema = z.object({
  analysisId: z.number().int().positive(),
  language: z.enum(['auto', 'en', 'fr', 'es', 'de']).default('auto'),
  /** Which story the letter should lead with. Mirrors the RewriteTab picker. */
  angle: z.enum(['jd', 'exp', 'tech']).default('jd'),
});

export class CoverLetterDto extends createZodDto(CoverLetterSchema) {}
