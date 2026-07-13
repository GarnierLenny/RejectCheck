-- Re-scan loop (P0.2).
--
-- 1. A deterministic keyword-match baseline (`keywordMatch`) on Analysis so a
--    re-scan can diff against the original without an LLM call.
-- 2. A self-referential lineage (`parentAnalysisId`) linking a full (paid)
--    re-scan back to the analysis it improves on. ON DELETE SET NULL so deleting
--    a parent leaves its re-scans intact (they're separate paid analyses).
-- 3. A lightweight `Rescan` table for the FREE keyword-only re-scan attempts,
--    kept out of Analysis so unlimited free re-scans don't bloat history/quota.
--    ON DELETE CASCADE: a quick re-scan has no meaning without its parent.

ALTER TABLE "Analysis"
  ADD COLUMN "keywordMatch" JSONB,
  ADD COLUMN "parentAnalysisId" INTEGER;

CREATE INDEX "Analysis_parentAnalysisId_idx" ON "Analysis"("parentAnalysisId");

ALTER TABLE "Analysis"
  ADD CONSTRAINT "Analysis_parentAnalysisId_fkey"
  FOREIGN KEY ("parentAnalysisId") REFERENCES "Analysis"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Rescan" (
  "id" SERIAL NOT NULL,
  "analysisId" INTEGER NOT NULL,
  "coverageScore" INTEGER NOT NULL,
  "matchedCount" INTEGER NOT NULL,
  "totalCount" INTEGER NOT NULL,
  "keywordMatch" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Rescan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Rescan_analysisId_createdAt_idx" ON "Rescan"("analysisId", "createdAt");

ALTER TABLE "Rescan"
  ADD CONSTRAINT "Rescan_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
