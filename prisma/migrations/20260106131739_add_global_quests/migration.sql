-- AlterEnum
ALTER TYPE "public"."QuestType" ADD VALUE 'GLOBAL';

-- AlterTable
ALTER TABLE "public"."Quest" ADD COLUMN     "globalProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "globalTarget" INTEGER,
ADD COLUMN     "globalUnit" TEXT;
