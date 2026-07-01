CREATE TYPE "AIInterviewDuration" AS ENUM ('MIN_15', 'MIN_30', 'MIN_45', 'MIN_60');

CREATE TYPE "IdentityVerificationOption" AS ENUM ('ENABLE', 'DISABLE');

ALTER TABLE "intern_subscription_plans"
  ADD COLUMN "isDiscount" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "interviewDuration" "AIInterviewDuration"[] NOT NULL DEFAULT ARRAY[]::"AIInterviewDuration"[],
  ADD COLUMN "interviewType" "AIInterviewCategory"[] NOT NULL DEFAULT ARRAY[]::"AIInterviewCategory"[],
  ADD COLUMN "identityVerification" "IdentityVerificationOption"[] NOT NULL DEFAULT ARRAY[]::"IdentityVerificationOption"[];
