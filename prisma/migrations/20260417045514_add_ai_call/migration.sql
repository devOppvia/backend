-- CreateEnum
CREATE TYPE "public"."AICallStatus" AS ENUM ('PENDING', 'INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER');

-- CreateTable
CREATE TABLE "public"."ai_call_questions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_call_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_calls" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateManagementId" TEXT NOT NULL,
    "status" "public"."AICallStatus" NOT NULL DEFAULT 'PENDING',
    "callSid" TEXT,
    "triggerScore" DOUBLE PRECISION NOT NULL,
    "transcript" JSONB,
    "callScore" DOUBLE PRECISION,
    "callSummary" TEXT,
    "duration" INTEGER,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_call_questions_id_key" ON "public"."ai_call_questions"("id");

-- CreateIndex
CREATE INDEX "ai_call_questions_companyId_jobId_isActive_idx" ON "public"."ai_call_questions"("companyId", "jobId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ai_calls_id_key" ON "public"."ai_calls"("id");

-- CreateIndex
CREATE INDEX "ai_calls_internId_status_idx" ON "public"."ai_calls"("internId", "status");

-- CreateIndex
CREATE INDEX "ai_calls_companyId_status_idx" ON "public"."ai_calls"("companyId", "status");

-- CreateIndex
CREATE INDEX "ai_calls_candidateManagementId_idx" ON "public"."ai_calls"("candidateManagementId");

-- AddForeignKey
ALTER TABLE "public"."ai_call_questions" ADD CONSTRAINT "ai_call_questions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_call_questions" ADD CONSTRAINT "ai_call_questions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_candidateManagementId_fkey" FOREIGN KEY ("candidateManagementId") REFERENCES "public"."candidate_management"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
