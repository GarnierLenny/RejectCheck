CREATE TABLE "Block" (
  "id"        SERIAL PRIMARY KEY,
  "blockerId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "blockedId" INTEGER NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");
CREATE INDEX "Block_blockerId_createdAt_idx" ON "Block"("blockerId", "createdAt");
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");
