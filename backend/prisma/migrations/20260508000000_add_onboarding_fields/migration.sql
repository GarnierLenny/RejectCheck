-- Onboarding fields on Profile (post-signup form: role, experience, stack, languages)
ALTER TABLE "Profile" ADD COLUMN "roleType" TEXT;
ALTER TABLE "Profile" ADD COLUMN "roleTypeOther" TEXT;
ALTER TABLE "Profile" ADD COLUMN "experienceLevel" TEXT;
ALTER TABLE "Profile" ADD COLUMN "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Profile" ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Profile" ADD COLUMN "onboardedAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN "onboardingSkipped" BOOLEAN NOT NULL DEFAULT false;

-- Skip onboarding for all profiles created before this feature shipped
-- (existing users won't be force-redirected to /onboarding on next login)
UPDATE "Profile" SET "onboardingSkipped" = true WHERE "onboardedAt" IS NULL;
