-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "isSinglePurchase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxPurchasePerUser" INTEGER DEFAULT 10;
