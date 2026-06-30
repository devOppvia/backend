ALTER TABLE "public"."subscriptions"
  RENAME COLUMN "numberOfResumeAccess" TO "numberOfApplications";

ALTER TABLE "public"."company_subscription"
  RENAME COLUMN "resumeAccessCredits" TO "numberOfApplications";

ALTER TABLE "public"."jobs"
  RENAME COLUMN "resumeAccessCredits" TO "numberOfApplications";
