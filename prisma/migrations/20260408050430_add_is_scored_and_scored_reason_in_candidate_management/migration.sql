-- AlterTable
ALTER TABLE "public"."candidate_management" ADD COLUMN     "isScored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scoredReason" TEXT;
