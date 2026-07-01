ALTER TABLE "intern_subscription_plans"
  ADD COLUMN "interviewMode" "AIInterviewType"[] NOT NULL DEFAULT ARRAY['COMPANY', 'PRACTICE']::"AIInterviewType"[];
