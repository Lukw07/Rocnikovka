-- CreateEnum
CREATE TYPE "public"."XPSourceType" AS ENUM ('ATTENDANCE', 'JOB', 'QUEST', 'ACTIVITY', 'EVENT', 'ACHIEVEMENT', 'BONUS');

-- CreateTable
CREATE TABLE "public"."XPSource" (
    "id" TEXT NOT NULL,
    "type" "public"."XPSourceType" NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bonusAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reason" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "maxStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "streakBrokenAt" TIMESTAMP(3),
    "totalParticipation" INTEGER NOT NULL DEFAULT 0,
    "currentMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "sources" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XPSource_userId_idx" ON "public"."XPSource"("userId");

-- CreateIndex
CREATE INDEX "XPSource_type_idx" ON "public"."XPSource"("type");

-- CreateIndex
CREATE INDEX "XPSource_createdAt_idx" ON "public"."XPSource"("createdAt");

-- CreateIndex
CREATE INDEX "XPSource_sourceId_idx" ON "public"."XPSource"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "public"."Streak"("userId");

-- CreateIndex
CREATE INDEX "Streak_userId_idx" ON "public"."Streak"("userId");

-- CreateIndex
CREATE INDEX "Streak_currentStreak_idx" ON "public"."Streak"("currentStreak");

-- CreateIndex
CREATE INDEX "DailyActivity_userId_idx" ON "public"."DailyActivity"("userId");

-- CreateIndex
CREATE INDEX "DailyActivity_date_idx" ON "public"."DailyActivity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyActivity_userId_date_key" ON "public"."DailyActivity"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."XPSource" ADD CONSTRAINT "XPSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyActivity" ADD CONSTRAINT "DailyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
