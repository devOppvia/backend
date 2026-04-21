-- Step 1: Drop old ai_calls table (removes dependency on old AICallStatus enum)
DROP TABLE IF EXISTS "public"."ai_calls" CASCADE;

-- Step 2: Drop old AICallStatus enum
DROP TYPE IF EXISTS "public"."AICallStatus";

-- Step 3: Create new AICallStatus enum
CREATE TYPE "public"."AICallStatus" AS ENUM ('PENDING', 'CALLING', 'COMPLETED', 'ALL_ATTEMPTS_EXHAUSTED', 'FAILED');

-- Step 4: Create new AICallAttemptStatus enum
CREATE TYPE "public"."AICallAttemptStatus" AS ENUM ('IN_PROGRESS', 'NOT_ANSWERED', 'ANSWERED_COMPLETED', 'ANSWERED_DROPPED', 'MACHINE_DETECTED', 'FAILED');

-- Step 5: Recreate ai_calls table with new columns
CREATE TABLE "public"."ai_calls" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateManagementId" TEXT NOT NULL,
    "status" "public"."AICallStatus" NOT NULL DEFAULT 'PENDING',
    "attemptNumber" INTEGER NOT NULL DEFAULT 0,
    "nextCallAt" TIMESTAMP(3),
    "allAttemptsExhausted" BOOLEAN NOT NULL DEFAULT false,
    "triggerScore" DOUBLE PRECISION NOT NULL,
    "transcript" JSONB,
    "callScore" DOUBLE PRECISION,
    "callSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_calls_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create ai_call_attempts table
CREATE TABLE "public"."ai_call_attempts" (
    "id" TEXT NOT NULL,
    "aiCallId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "callSid" TEXT,
    "status" "public"."AICallAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "duration" INTEGER,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_call_attempts_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create indexes for ai_calls
CREATE UNIQUE INDEX "ai_calls_id_key" ON "public"."ai_calls"("id");
CREATE INDEX "ai_calls_internId_status_idx" ON "public"."ai_calls"("internId", "status");
CREATE INDEX "ai_calls_companyId_status_idx" ON "public"."ai_calls"("companyId", "status");
CREATE INDEX "ai_calls_candidateManagementId_idx" ON "public"."ai_calls"("candidateManagementId");
CREATE INDEX "ai_calls_nextCallAt_allAttemptsExhausted_status_idx" ON "public"."ai_calls"("nextCallAt", "allAttemptsExhausted", "status");

-- Step 8: Create indexes for ai_call_attempts
CREATE UNIQUE INDEX "ai_call_attempts_id_key" ON "public"."ai_call_attempts"("id");
CREATE INDEX "ai_call_attempts_aiCallId_idx" ON "public"."ai_call_attempts"("aiCallId");
CREATE INDEX "ai_call_attempts_callSid_idx" ON "public"."ai_call_attempts"("callSid");

-- Step 9: Add foreign keys for ai_calls
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."ai_calls" ADD CONSTRAINT "ai_calls_candidateManagementId_fkey" FOREIGN KEY ("candidateManagementId") REFERENCES "public"."candidate_management"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Add foreign key for ai_call_attempts
ALTER TABLE "public"."ai_call_attempts" ADD CONSTRAINT "ai_call_attempts_aiCallId_fkey" FOREIGN KEY ("aiCallId") REFERENCES "public"."ai_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
