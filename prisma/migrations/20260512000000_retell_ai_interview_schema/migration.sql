-- AlterTable
ALTER TABLE "public"."ai_calls"
ADD COLUMN     "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interviewCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repeatCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "conversationState" TEXT NOT NULL DEFAULT 'INTRO';

-- AlterTable
ALTER TABLE "public"."ai_call_attempts"
ADD COLUMN     "retellCallId" TEXT;

-- CreateTable
CREATE TABLE "public"."ai_call_answers" (
    "id" TEXT NOT NULL,
    "aiCallId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_call_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_call_answers_aiCallId_idx" ON "public"."ai_call_answers"("aiCallId");

-- CreateIndex
CREATE INDEX "ai_call_answers_questionId_idx" ON "public"."ai_call_answers"("questionId");

-- CreateIndex
CREATE INDEX "ai_call_attempts_retellCallId_idx" ON "public"."ai_call_attempts"("retellCallId");

-- AddForeignKey
ALTER TABLE "public"."ai_call_answers" ADD CONSTRAINT "ai_call_answers_aiCallId_fkey" FOREIGN KEY ("aiCallId") REFERENCES "public"."ai_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_call_answers" ADD CONSTRAINT "ai_call_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."ai_call_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
