-- Work-eligibility signals on Profile: the outcome factors the CV-vs-JD score is
-- blind to (location, remote fit, visa sponsorship). Person-level and stable, so
-- they are collected once at onboarding and reused across analyses to flag hard
-- mismatches (e.g. needs sponsorship + foreign on-site role). All nullable; no
-- backfill needed (unanswered = null).
ALTER TABLE "Profile" ADD COLUMN "country" TEXT;
ALTER TABLE "Profile" ADD COLUMN "remotePreference" TEXT;
ALTER TABLE "Profile" ADD COLUMN "needsSponsorship" BOOLEAN;
