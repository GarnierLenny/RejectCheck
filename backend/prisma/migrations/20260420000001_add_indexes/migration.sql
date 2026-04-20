-- CreateIndex
CREATE INDEX "Analysis_email_idx" ON "Analysis"("email");

-- CreateIndex
CREATE INDEX "Analysis_ip_idx" ON "Analysis"("ip");

-- CreateIndex
CREATE INDEX "Application_email_idx" ON "Application"("email");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "InterviewAttempt_email_idx" ON "InterviewAttempt"("email");

-- CreateIndex
CREATE INDEX "InterviewAttempt_analysisId_idx" ON "InterviewAttempt"("analysisId");
