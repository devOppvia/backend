/*
  Warnings:

  - A unique constraint covering the columns `[aiCallId,attemptNumber]` on the table `ai_call_attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ai_call_attempts" DROP CONSTRAINT "ai_call_attempts_aiCallId_fkey";

-- AlterTable
ALTER TABLE "public"."jobs" ADD COLUMN     "callConditionScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "callEnable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ai_call_attempts_aiCallId_attemptNumber_key" ON "public"."ai_call_attempts"("aiCallId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "public"."ai_call_attempts" ADD CONSTRAINT "ai_call_attempts_aiCallId_fkey" FOREIGN KEY ("aiCallId") REFERENCES "public"."ai_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
