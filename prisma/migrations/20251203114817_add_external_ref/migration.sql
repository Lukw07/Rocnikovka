-- AlterTable
ALTER TABLE "public"."Achievement" ADD COLUMN     "target" INTEGER;

-- AlterTable
ALTER TABLE "public"."Class" ALTER COLUMN "grade" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "isPurchasable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."ExternalRef" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "internalId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalRef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalRef_type_idx" ON "public"."ExternalRef"("type");

-- CreateIndex
CREATE INDEX "ExternalRef_internalId_idx" ON "public"."ExternalRef"("internalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRef_type_externalId_key" ON "public"."ExternalRef"("type", "externalId");

-- CreateIndex
CREATE INDEX "User_grade_idx" ON "public"."User"("grade");
