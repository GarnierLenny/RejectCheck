-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('shortlisted', 'hired');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', 'paused');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('interested', 'applied', 'interviewing', 'offer', 'rejected');

-- AlterTable Subscription
ALTER TABLE "Subscription"
  ALTER COLUMN "plan" TYPE "SubscriptionPlan" USING "plan"::"SubscriptionPlan",
  ALTER COLUMN "status" TYPE "SubscriptionStatus" USING "status"::"SubscriptionStatus";

-- AlterTable Application: drop default, change type, restore default
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus" USING "status"::"ApplicationStatus";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'applied'::"ApplicationStatus";
