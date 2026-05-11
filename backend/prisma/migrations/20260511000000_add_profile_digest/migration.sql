ALTER TABLE "Profile" ADD COLUMN "digest" JSONB;
ALTER TABLE "Profile" ADD COLUMN "digestUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN "digestSourceHashes" JSONB;
