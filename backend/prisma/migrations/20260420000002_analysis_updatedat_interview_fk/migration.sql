-- AlterTable: add updatedAt to Analysis (backfill existing rows with createdAt value)
ALTER TABLE "Analysis" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AddForeignKey: InterviewAttempt.analysisId → Analysis.id
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
