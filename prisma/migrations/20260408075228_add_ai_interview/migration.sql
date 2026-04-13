-- CreateEnum
CREATE TYPE "public"."AIInterviewType" AS ENUM ('COMPANY', 'PRACTICE');

-- CreateEnum
CREATE TYPE "public"."AIInterviewStatus" AS ENUM ('SETUP', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."AIInterviewerPreference" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."AIInterviewCategory" AS ENUM ('BEHAVIORAL', 'TECHNICAL', 'CASE_STUDY', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."ExpressionEmotion" AS ENUM ('CONFIDENT', 'NERVOUS', 'NEUTRAL', 'HAPPY', 'CONFUSED');

-- CreateTable
CREATE TABLE "public"."intern_subscription_plans" (
    "id" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discountedPrice" INTEGER NOT NULL,
    "interviewCredits" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intern_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."intern_subscriptions" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "interviewCreditsTotal" INTEGER NOT NULL,
    "interviewCreditsRemaining" INTEGER NOT NULL,
    "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "amountPaid" INTEGER NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intern_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_interviews" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "type" "public"."AIInterviewType" NOT NULL,
    "interviewerPreference" "public"."AIInterviewerPreference" NOT NULL DEFAULT 'MALE',
    "interviewCategory" "public"."AIInterviewCategory" NOT NULL DEFAULT 'MIXED',
    "identityVerification" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER NOT NULL,
    "jobDescription" TEXT,
    "companyWebsite" TEXT,
    "additionalContext" TEXT,
    "resumeSnapshot" TEXT NOT NULL,
    "status" "public"."AIInterviewStatus" NOT NULL DEFAULT 'SETUP',
    "totalQuestions" INTEGER,
    "overallScore" DOUBLE PRECISION,
    "avgAnswerScore" DOUBLE PRECISION,
    "starUsed" INTEGER,
    "topSkill" TEXT,
    "durationActual" INTEGER,
    "confidenceScore" DOUBLE PRECISION,
    "dominantEmotion" TEXT,
    "behaviorSummary" JSONB,
    "aiInsights" JSONB,
    "reportPdfPath" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_interview_questions" (
    "id" TEXT NOT NULL,
    "aiInterviewId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT,
    "answerScore" DOUBLE PRECISION,
    "starUsed" BOOLEAN NOT NULL DEFAULT false,
    "skillTested" TEXT,
    "aiFeedback" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_interview_expressions" (
    "id" TEXT NOT NULL,
    "aiInterviewId" TEXT NOT NULL,
    "questionId" TEXT,
    "emotion" "public"."ExpressionEmotion" NOT NULL DEFAULT 'NEUTRAL',
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interview_expressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intern_subscription_plans_id_key" ON "public"."intern_subscription_plans"("id");

-- CreateIndex
CREATE UNIQUE INDEX "intern_subscriptions_id_key" ON "public"."intern_subscriptions"("id");

-- CreateIndex
CREATE INDEX "intern_subscriptions_internId_isActive_idx" ON "public"."intern_subscriptions"("internId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ai_interviews_id_key" ON "public"."ai_interviews"("id");

-- CreateIndex
CREATE INDEX "ai_interviews_internId_status_idx" ON "public"."ai_interviews"("internId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_interview_questions_id_key" ON "public"."ai_interview_questions"("id");

-- CreateIndex
CREATE INDEX "ai_interview_questions_aiInterviewId_questionNumber_idx" ON "public"."ai_interview_questions"("aiInterviewId", "questionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ai_interview_expressions_id_key" ON "public"."ai_interview_expressions"("id");

-- CreateIndex
CREATE INDEX "ai_interview_expressions_aiInterviewId_idx" ON "public"."ai_interview_expressions"("aiInterviewId");

-- AddForeignKey
ALTER TABLE "public"."intern_subscriptions" ADD CONSTRAINT "intern_subscriptions_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."intern_subscriptions" ADD CONSTRAINT "intern_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."intern_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_interviews" ADD CONSTRAINT "ai_interviews_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_interview_questions" ADD CONSTRAINT "ai_interview_questions_aiInterviewId_fkey" FOREIGN KEY ("aiInterviewId") REFERENCES "public"."ai_interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_interview_expressions" ADD CONSTRAINT "ai_interview_expressions_aiInterviewId_fkey" FOREIGN KEY ("aiInterviewId") REFERENCES "public"."ai_interviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
