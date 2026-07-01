ALTER TABLE "intern_subscription_plans"
  DROP COLUMN "interviewType",
  ADD COLUMN "interviewType" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "ai_interviews"
  ADD COLUMN "interviewCategories" "AIInterviewCategory"[] NOT NULL DEFAULT ARRAY[]::"AIInterviewCategory"[];
