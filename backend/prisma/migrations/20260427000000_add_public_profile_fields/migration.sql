-- 1. Normalize existing usernames to lowercase
UPDATE "Profile" SET "username" = LOWER("username") WHERE "username" IS NOT NULL;

-- 2. Backfill collisions: keep the oldest row's username, null the rest
UPDATE "Profile"
SET "username" = NULL
WHERE "id" NOT IN (
  SELECT MIN("id")
  FROM "Profile"
  WHERE "username" IS NOT NULL
  GROUP BY "username"
)
AND "username" IS NOT NULL;

-- 3. New columns
ALTER TABLE "Profile" ADD COLUMN "usernameUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN "bio" TEXT;

-- 4. Unique constraint on username
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
