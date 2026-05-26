-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_shareToken_key" ON "Analysis"("shareToken");
