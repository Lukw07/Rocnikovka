-- CreateEnum
CREATE TYPE "public"."GuildJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedBy" TEXT;

-- CreateTable
CREATE TABLE "public"."GuildJoinRequest" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."GuildJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuildJoinRequest_guildId_idx" ON "public"."GuildJoinRequest"("guildId");

-- CreateIndex
CREATE INDEX "GuildJoinRequest_userId_idx" ON "public"."GuildJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "GuildJoinRequest_status_idx" ON "public"."GuildJoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GuildJoinRequest_guildId_userId_status_key" ON "public"."GuildJoinRequest"("guildId", "userId", "status");

-- CreateIndex
CREATE INDEX "User_banned_idx" ON "public"."User"("banned");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_bannedBy_fkey" FOREIGN KEY ("bannedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildJoinRequest" ADD CONSTRAINT "GuildJoinRequest_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildJoinRequest" ADD CONSTRAINT "GuildJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
