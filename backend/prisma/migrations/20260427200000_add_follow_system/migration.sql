-- Profile counters and notification tracking
ALTER TABLE "Profile" ADD COLUMN "followersCount"      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD COLUMN "followingCount"      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD COLUMN "followersLastSeenAt" TIMESTAMP(3);

-- Follow table
CREATE TABLE "Follow" (
  "id"           SERIAL PRIMARY KEY,
  "followerId"   INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "followingId"  INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX "Follow_followerId_createdAt_idx" ON "Follow"("followerId", "createdAt");
CREATE INDEX "Follow_followingId_createdAt_idx" ON "Follow"("followingId", "createdAt");
