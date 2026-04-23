-- Wipe existing challenges (and their attempts) before the schema rename.
-- ChallengeAttempt has ON DELETE RESTRICT against DailyChallenge, so attempts go first.
DELETE FROM "ChallengeAttempt";
DELETE FROM "DailyChallenge";

-- DropIndex: old single-column unique
DROP INDEX "DailyChallenge_date_key";

-- AlterTable: drop `theme`, add `focusTag` + `language`
ALTER TABLE "DailyChallenge" DROP COLUMN "theme";
ALTER TABLE "DailyChallenge" ADD COLUMN "focusTag" TEXT NOT NULL;
ALTER TABLE "DailyChallenge" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'typescript';

-- CreateIndex: new compound unique on (date, language) so multiple languages can coexist per day
CREATE UNIQUE INDEX "DailyChallenge_date_language_key" ON "DailyChallenge"("date", "language");
