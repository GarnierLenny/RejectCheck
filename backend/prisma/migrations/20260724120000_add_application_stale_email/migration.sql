-- Event-triggered nudge for tracked applications that have gone quiet.
--
-- The EmailLog.type column is a Postgres enum, so a new email type needs the
-- value added here before anything can write it. Additive and safe: existing
-- rows are untouched and no code reads the value until
-- STALE_APPLICATION_EMAILS_ENABLED is turned on.
--
-- NOTE: `ALTER TYPE ... ADD VALUE` may not be used in the same transaction that
-- then writes the new value. This migration only declares it, so it is fine.

ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'application_stale';
