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
  jobLabel: z.string().max(60).optional(),
  // NOTE: identity (email / registered) is NOT taken from the body — it is
  // derived server-side from the verified Supabase JWT (OptionalSupabaseGuard).
  // Accepting it from the client would let anyone impersonate any user's tier
  // or burn another user's quota/credits.
  locale: z.enum(['en', 'fr']).optional().default('en'),
  // Owner teaser flag. FormData sends strings, so coerce "true" → true. Only
  // honored server-side when the JWT email is in OWNER_EMAILS (see use case) —
  // a non-owner setting this just gets a normal, quota-counted analysis.
  auditMode: z
    .preprocess((v) => v === 'true' || v === true, z.boolean())
    .optional()
    .default(false),
});

export class AnalyzeRequestDto extends createZodDto(AnalyzeRequestSchema) {}
