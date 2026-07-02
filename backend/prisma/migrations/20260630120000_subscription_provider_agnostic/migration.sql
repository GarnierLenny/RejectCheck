-- Provider-agnostic subscriptions: Stripe (web) + RevenueCat (mobile IAP) write
-- to the SAME email-keyed Subscription table, distinguished by `provider`.
-- Existing rows default to 'stripe' (no backfill needed). `stripeCustomerId`
-- becomes nullable (RevenueCat rows have none); `externalRef` holds the
-- RevenueCat app_user_id for audit/lookup.

CREATE TYPE "SubscriptionProvider" AS ENUM ('stripe', 'revenuecat');

ALTER TABLE "Subscription"
  ADD COLUMN "provider" "SubscriptionProvider" NOT NULL DEFAULT 'stripe',
  ADD COLUMN "externalRef" TEXT,
  ALTER COLUMN "stripeCustomerId" DROP NOT NULL;

-- email is no longer globally unique; uniqueness is now per (email, provider)
-- so one user can hold a Stripe AND a RevenueCat subscription at once.
DROP INDEX "Subscription_email_key";
CREATE UNIQUE INDEX "Subscription_email_provider_key" ON "Subscription"("email", "provider");

CREATE INDEX "Subscription_provider_externalRef_idx" ON "Subscription"("provider", "externalRef");
