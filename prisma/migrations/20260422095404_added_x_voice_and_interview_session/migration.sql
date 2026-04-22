-- AlterTable
ALTER TABLE "public"."ai_interviews" ADD COLUMN     "silenceDuration" INTEGER NOT NULL DEFAULT 700,
ADD COLUMN     "vadThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "voiceUsed" TEXT NOT NULL DEFAULT 'eve';
