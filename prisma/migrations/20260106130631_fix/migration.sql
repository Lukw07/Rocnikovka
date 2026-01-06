/*
  Warnings:

  - You are about to drop the column `isSinglePurchase` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `maxPurchasePerUser` on the `Item` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."JobBadgeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_subjectId_fkey";

-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "isSinglePurchase",
DROP COLUMN "maxPurchasePerUser",
ADD COLUMN     "purchaseConfig" JSONB;

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "approvedBadgeId" TEXT,
ALTER COLUMN "subjectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."JobBadgeRequest" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "public"."JobBadgeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "JobBadgeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyQuestion" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "moneyReward" INTEGER NOT NULL DEFAULT 10,
    "skillpointReward" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyQuestionAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedAnswer" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BossEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxHp" INTEGER NOT NULL DEFAULT 1000,
    "currentHp" INTEGER NOT NULL DEFAULT 1000,
    "level" INTEGER NOT NULL DEFAULT 10,
    "xpRewardPerKill" INTEGER NOT NULL DEFAULT 500,
    "moneyRewardPerKill" INTEGER NOT NULL DEFAULT 100,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "isDefeated" BOOLEAN NOT NULL DEFAULT false,
    "defeatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BossEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BossEventParticipant" (
    "id" TEXT NOT NULL,
    "bossEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalDamage" INTEGER NOT NULL DEFAULT 0,
    "attackCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BossEventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BossAttack" (
    "id" TEXT NOT NULL,
    "bossEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "damage" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "attackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BossAttack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobBadgeRequest_status_idx" ON "public"."JobBadgeRequest"("status");

-- CreateIndex
CREATE INDEX "JobBadgeRequest_jobId_idx" ON "public"."JobBadgeRequest"("jobId");

-- CreateIndex
CREATE INDEX "JobBadgeRequest_badgeId_idx" ON "public"."JobBadgeRequest"("badgeId");

-- CreateIndex
CREATE INDEX "JobBadgeRequest_requestedBy_idx" ON "public"."JobBadgeRequest"("requestedBy");

-- CreateIndex
CREATE INDEX "JobBadgeRequest_reviewerId_idx" ON "public"."JobBadgeRequest"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestion_date_key" ON "public"."DailyQuestion"("date");

-- CreateIndex
CREATE INDEX "DailyQuestion_eventId_idx" ON "public"."DailyQuestion"("eventId");

-- CreateIndex
CREATE INDEX "DailyQuestion_date_idx" ON "public"."DailyQuestion"("date");

-- CreateIndex
CREATE INDEX "DailyQuestion_createdBy_idx" ON "public"."DailyQuestion"("createdBy");

-- CreateIndex
CREATE INDEX "DailyQuestion_eventId_date_idx" ON "public"."DailyQuestion"("eventId", "date");

-- CreateIndex
CREATE INDEX "DailyQuestionAnswer_questionId_idx" ON "public"."DailyQuestionAnswer"("questionId");

-- CreateIndex
CREATE INDEX "DailyQuestionAnswer_userId_idx" ON "public"."DailyQuestionAnswer"("userId");

-- CreateIndex
CREATE INDEX "DailyQuestionAnswer_answeredAt_idx" ON "public"."DailyQuestionAnswer"("answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionAnswer_questionId_userId_key" ON "public"."DailyQuestionAnswer"("questionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BossEvent_eventId_key" ON "public"."BossEvent"("eventId");

-- CreateIndex
CREATE INDEX "BossEvent_eventId_idx" ON "public"."BossEvent"("eventId");

-- CreateIndex
CREATE INDEX "BossEvent_isDefeated_idx" ON "public"."BossEvent"("isDefeated");

-- CreateIndex
CREATE INDEX "BossEvent_level_idx" ON "public"."BossEvent"("level");

-- CreateIndex
CREATE INDEX "BossEventParticipant_bossEventId_idx" ON "public"."BossEventParticipant"("bossEventId");

-- CreateIndex
CREATE INDEX "BossEventParticipant_userId_idx" ON "public"."BossEventParticipant"("userId");

-- CreateIndex
CREATE INDEX "BossEventParticipant_totalDamage_idx" ON "public"."BossEventParticipant"("totalDamage");

-- CreateIndex
CREATE UNIQUE INDEX "BossEventParticipant_bossEventId_userId_key" ON "public"."BossEventParticipant"("bossEventId", "userId");

-- CreateIndex
CREATE INDEX "BossAttack_bossEventId_idx" ON "public"."BossAttack"("bossEventId");

-- CreateIndex
CREATE INDEX "BossAttack_userId_idx" ON "public"."BossAttack"("userId");

-- CreateIndex
CREATE INDEX "BossAttack_attackedAt_idx" ON "public"."BossAttack"("attackedAt");

-- CreateIndex
CREATE INDEX "Job_approvedBadgeId_idx" ON "public"."Job"("approvedBadgeId");

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_approvedBadgeId_fkey" FOREIGN KEY ("approvedBadgeId") REFERENCES "public"."Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBadgeRequest" ADD CONSTRAINT "JobBadgeRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBadgeRequest" ADD CONSTRAINT "JobBadgeRequest_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBadgeRequest" ADD CONSTRAINT "JobBadgeRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBadgeRequest" ADD CONSTRAINT "JobBadgeRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyQuestion" ADD CONSTRAINT "DailyQuestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyQuestion" ADD CONSTRAINT "DailyQuestion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyQuestionAnswer" ADD CONSTRAINT "DailyQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."DailyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyQuestionAnswer" ADD CONSTRAINT "DailyQuestionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BossEvent" ADD CONSTRAINT "BossEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BossEventParticipant" ADD CONSTRAINT "BossEventParticipant_bossEventId_fkey" FOREIGN KEY ("bossEventId") REFERENCES "public"."BossEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BossEventParticipant" ADD CONSTRAINT "BossEventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BossAttack" ADD CONSTRAINT "BossAttack_bossEventId_fkey" FOREIGN KEY ("bossEventId") REFERENCES "public"."BossEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BossAttack" ADD CONSTRAINT "BossAttack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
