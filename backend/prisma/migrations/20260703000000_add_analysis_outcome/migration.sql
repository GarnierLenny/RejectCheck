-- Per-analysis real-world outcome (moat: calibrate the risk score against what
-- actually happened). Default `not_applied` because analyses are usually run
-- BEFORE applying (analyze → fix → apply). Existing rows adopt the default; no
-- backfill needed. `outcomeUpdatedAt` stays NULL until the user first sets it.

CREATE TYPE "AnalysisOutcome" AS ENUM ('not_applied', 'applied', 'no_response', 'interview', 'offer', 'rejected');

ALTER TABLE "Analysis"
  ADD COLUMN "outcome" "AnalysisOutcome" NOT NULL DEFAULT 'not_applied',
  ADD COLUMN "outcomeUpdatedAt" TIMESTAMP(3);
