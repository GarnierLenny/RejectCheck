-- Denormalised percentile inputs (Phase 2 of docs/plan-comparative-score-frame.md).
--
-- `cv_quality.overall` and the resolved role family both live inside the
-- `result` JSONB column with no index, so every score-distribution query is an
-- unindexed scan of the whole table. That is the structural blocker on ever
-- showing "you rank in the top X% of <family> CVs", independently of volume.
--
-- Ships DARK on purpose: nothing reads these columns yet. The per-family
-- percentile only renders once a family clears PERCENTILE_MIN_N (200), which at
-- the current rate is months away. The columns exist now so the data stops being
-- lost in the meantime.
--
-- Additive and nullable: no rewrite of existing rows, no lock beyond the ALTER.

ALTER TABLE "Analysis"
  ADD COLUMN "cvQualityOverall" INTEGER,
  ADD COLUMN "roleFamily" TEXT;

-- Backfill the score from history. Safe and exact: it reads the same field the
-- report renders. Guarded on jsonb_typeof so a malformed legacy payload cannot
-- abort the migration on a failed cast.
UPDATE "Analysis"
SET "cvQualityOverall" = ("result" -> 'cv_quality' ->> 'overall')::INTEGER
WHERE "result" -> 'cv_quality' ->> 'overall' IS NOT NULL
  AND jsonb_typeof("result" -> 'cv_quality' -> 'overall') = 'number';

-- NOTE: `roleFamily` is deliberately NOT backfilled here. Resolving it needs the
-- archetype cue table (backend/src/analyze/domain/score/role-family.ts), which
-- is TypeScript, not SQL — reimplementing those 14 families in SQL would create
-- a third copy to keep in sync. New analyses populate it on write; history can
-- be filled by a one-off script whenever the percentile is actually switched on.

CREATE INDEX "Analysis_roleFamily_cvQualityOverall_idx"
  ON "Analysis"("roleFamily", "cvQualityOverall");
