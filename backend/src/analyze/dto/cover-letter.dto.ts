import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CoverLetterSchema = z.object({
  analysisId: z.number(),
  language: z.enum(['auto', 'en', 'fr', 'es', 'de']).default('auto'),
});

export class CoverLetterDto extends createZodDto(CoverLetterSchema) {}
