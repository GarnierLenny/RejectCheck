-- Drop the former Haiku ProfileDigest machinery. Cross-examination now runs
-- inside the main analysis call, so the fused digest, its source hashes, and
-- the "last synced" timestamp are no longer produced or consumed (the settings
-- widget that surfaced digestUpdatedAt is removed too).
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "digest";
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "digestSourceHashes";
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "digestUpdatedAt";
