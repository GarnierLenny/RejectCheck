-- Sprint pass: a one-time payment granting hired-tier access for a bounded
-- window (see stripe/domain/sprint-pass.ts). It is stored as a Subscription row
-- under this new provider so it never collides with a recurring `stripe` row on
-- the (email, provider) unique key, and so the recurring subscription webhooks
-- (which now match on provider='stripe') never touch it. No data backfill:
-- existing rows keep their provider. currentPeriodEnd on a stripe_sprint row
-- holds the pass expiry, so isActive() expires it with no extra column.

ALTER TYPE "SubscriptionProvider" ADD VALUE 'stripe_sprint';
