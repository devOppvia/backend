-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AIInterviewCategory" ADD VALUE 'SYSTEM_DESIGN';
ALTER TYPE "public"."AIInterviewCategory" ADD VALUE 'CODING_DSA';
ALTER TYPE "public"."AIInterviewCategory" ADD VALUE 'HR_CULTURE_FIT';
ALTER TYPE "public"."AIInterviewCategory" ADD VALUE 'PROJECT_DEEP_DIVE';
ALTER TYPE "public"."AIInterviewCategory" ADD VALUE 'RESUME_BASED';
ALTER TYPE "public"."AIInterviewCategory" ADD VALUE 'DEBUGGING';
