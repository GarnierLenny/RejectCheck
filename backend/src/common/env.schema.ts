import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8888),

  CORS_ORIGIN: nonEmpty,
  FRONTEND_URL: nonEmpty,

  DATABASE_URL: nonEmpty,

  SUPABASE_URL: nonEmpty.refine((v) => v.startsWith('https://'), {
    message: 'SUPABASE_URL must start with https://',
  }),

  ANTHROPIC_API_KEY: nonEmpty,
  // OpenAI is currently optional: only used by interview.service.ts for TTS + Whisper.
  // The service guards every call with `if (this.openai)`, so a missing key disables
  // the Interview audio features but the rest of the app still boots.
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: nonEmpty,

  STRIPE_SECRET_KEY: nonEmpty,
  STRIPE_WEBHOOK_SECRET: nonEmpty,
  STRIPE_SHORTLISTED_PRICE_ID: nonEmpty,
  STRIPE_HIRED_PRICE_ID: nonEmpty,

  SYSTEM_TECHNICAL_PROMPT: z.string().optional(),
  CHALLENGE_GENERATION_PROMPT: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    // Use stderr directly: Logger isn't available at boot time.

    console.error(`\nInvalid environment configuration:\n${issues}\n`);
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}
