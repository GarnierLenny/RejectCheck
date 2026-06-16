import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8888),

  CORS_ORIGIN: nonEmpty,
  FRONTEND_URL: nonEmpty,

  // Runtime connection — should point at Supabase's transaction-mode
  // pooler (port 6543) in production with `?pgbouncer=true&connection_limit=N`
  // so backend Postgres connections are short-lived and shared.
  DATABASE_URL: nonEmpty,

  // Connection used by Prisma for migrations and introspection (these need
  // session-level state and break on the transaction-mode pooler). Point it
  // at the direct connection or the session-mode pooler (port 5432). Falls
  // back to DATABASE_URL when unset — fine for local dev that doesn't use
  // the transaction pooler.
  DIRECT_URL: z.string().optional(),

  // Optional. If set, deep/negotiation LLM passes are enqueued to BullMQ
  // (concurrency-limited, retryable, persistent). If unset, they run via
  // setImmediate in the same Node process — fine for local dev, not ideal
  // for Railway Hobby production.
  REDIS_URL: z.string().optional(),

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
  // One-time price (mode=payment) for analysis credits. 2 EUR per credit at
  // ship; quantity is chosen by the user in our Tailwind modal and passed
  // through Stripe Checkout as line_items[0].quantity.
  STRIPE_CREDIT_PRICE_ID: nonEmpty,


  SENTRY_DSN: z.string().optional(),

  // ── Email (Resend) ────────────────────────────────────────────────────────
  // All optional. When EMAIL_ENABLED!=='true' or RESEND_API_KEY is unset, the
  // NotificationsModule wires the LoggerEmailAdapter (emails are logged, not
  // sent) — so the app boots and works without any email config, and local dev
  // never sends real mail. Set both to send via Resend. Links in emails reuse
  // FRONTEND_URL.
  EMAIL_ENABLED: z.enum(['true', 'false']).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_REPLY_TO: z.string().optional(),
  // Public base URL used inside emails for images AND links. Email clients
  // (Gmail's image proxy) can't reach localhost, so this must be a public
  // HTTPS origin even in dev. Falls back to FRONTEND_URL when unset.
  EMAIL_BASE_URL: z.string().optional(),
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
