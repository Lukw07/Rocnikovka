-- CreateTable
CREATE TABLE "public"."SkillPoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "unlockLevel" INTEGER NOT NULL DEFAULT 0,
    "lastLeveledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "maxLevel" INTEGER NOT NULL DEFAULT 10,
    "unlockLevel" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reputation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReputationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillPoint_userId_key" ON "public"."SkillPoint"("userId");

-- CreateIndex
CREATE INDEX "SkillPoint_userId_idx" ON "public"."SkillPoint"("userId");

-- CreateIndex
CREATE INDEX "PlayerSkill_userId_idx" ON "public"."PlayerSkill"("userId");

-- CreateIndex
CREATE INDEX "PlayerSkill_skillId_idx" ON "public"."PlayerSkill"("skillId");

-- CreateIndex
CREATE INDEX "PlayerSkill_level_idx" ON "public"."PlayerSkill"("level");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSkill_userId_skillId_key" ON "public"."PlayerSkill"("userId", "skillId");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "public"."Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_isActive_idx" ON "public"."Skill"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Reputation_userId_key" ON "public"."Reputation"("userId");

-- CreateIndex
CREATE INDEX "Reputation_userId_idx" ON "public"."Reputation"("userId");

-- CreateIndex
CREATE INDEX "Reputation_tier_idx" ON "public"."Reputation"("tier");

-- CreateIndex
CREATE INDEX "ReputationLog_userId_idx" ON "public"."ReputationLog"("userId");

-- CreateIndex
CREATE INDEX "ReputationLog_createdAt_idx" ON "public"."ReputationLog"("createdAt");

-- CreateIndex
CREATE INDEX "ReputationLog_sourceId_idx" ON "public"."ReputationLog"("sourceId");

-- AddForeignKey
ALTER TABLE "public"."SkillPoint" ADD CONSTRAINT "SkillPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerSkill" ADD CONSTRAINT "PlayerSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerSkill" ADD CONSTRAINT "PlayerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reputation" ADD CONSTRAINT "Reputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReputationLog" ADD CONSTRAINT "ReputationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
