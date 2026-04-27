-- Profile denormalized challenge totals
ALTER TABLE "Profile" ADD COLUMN "totalChallengeScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD COLUMN "totalChallengeCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill counters from existing finalized attempts
WITH stats AS (
  SELECT "email", COALESCE(SUM("score"), 0) AS sum_score, COUNT(*) AS cnt
  FROM "ChallengeAttempt"
  WHERE "score" > 0
  GROUP BY "email"
)
UPDATE "Profile" p
SET
  "totalChallengeScore" = stats.sum_score,
  "totalChallengeCount" = stats.cnt
FROM stats
WHERE p."email" = stats."email";

-- Indexes for fast leaderboard queries
CREATE INDEX "Profile_totalChallengeScore_idx" ON "Profile"("totalChallengeScore" DESC);
CREATE INDEX "ChallengeAttempt_challengeId_score_completedAt_idx"
  ON "ChallengeAttempt"("challengeId", "score" DESC, "completedAt");
CREATE INDEX "ChallengeStreak_currentStreak_idx" ON "ChallengeStreak"("currentStreak" DESC);
