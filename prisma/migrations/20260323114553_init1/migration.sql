-- CreateEnum
CREATE TYPE "public"."InternStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."InternshipType" AS ENUM ('REMOTE', 'OFFICE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('REMOTE', 'HYBRID', 'OFFICE');

-- CreateEnum
CREATE TYPE "public"."ApplicationType" AS ENUM ('JOB', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "public"."WorkMode" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'ANY');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('REVIEW', 'APPROVED', 'PAUSED', 'COMPLETED', 'REJECTED', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."StipendValue" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "public"."SubscriptionTime" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."CandidateStatus" AS ENUM ('SHORTLISTED', 'REVIEW', 'INTERVIEW', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionType" AS ENUM ('JOBPOSTING', 'RESUMEBANK');

-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ResumeStatus" AS ENUM ('REVIEW', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."InterViewType" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interns" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "fcmToken" TEXT,
    "profilePicture" TEXT,
    "DOB" TEXT NOT NULL,
    "gender" "public"."Gender" NOT NULL DEFAULT 'MALE',
    "highestQualification" TEXT NOT NULL,
    "collageOrUniversityName" TEXT NOT NULL,
    "degreeOrCourse" TEXT NOT NULL,
    "yosOrGraduationYear" TEXT NOT NULL,
    "resume" TEXT NOT NULL,
    "industry" JSONB NOT NULL,
    "department" JSONB NOT NULL,
    "personalDetails" TEXT,
    "projectLink" JSONB,
    "internshipType" "public"."InternshipType" NOT NULL,
    "reasonOffboard" TEXT,
    "mobileOtp" TEXT,
    "isMobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailOtp" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailOtpExpiry" TIMESTAMP(3),
    "mobileOtpExpiry" TIMESTAMP(3),
    "isResumeActive" BOOLEAN NOT NULL DEFAULT true,
    "isResumeDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isProfileComplate" BOOLEAN NOT NULL DEFAULT true,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "isOpenToWork" BOOLEAN NOT NULL DEFAULT true,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpVerifyAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpVerifyBlockedUntil" TIMESTAMP(3),
    "emailOtpVerifyAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailOtpVerifyBlockedUntil" TIMESTAMP(3),
    "applicationType" "public"."ApplicationType" NOT NULL DEFAULT 'INTERNSHIP',
    "experience" TEXT,
    "internStatus" "public"."InternStatus" NOT NULL DEFAULT 'PENDING',
    "linkedin" TEXT,
    "github" TEXT,
    "portfolio" TEXT,
    "employmentType" "public"."WorkMode" NOT NULL DEFAULT 'ANY',
    "preferredAll" BOOLEAN NOT NULL DEFAULT false,
    "cityId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_draft" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "personDesignation" TEXT,
    "personName" TEXT,
    "password" TEXT,
    "companyLogo" TEXT,
    "companySortLogo" TEXT,
    "industryType" TEXT,
    "companySize" TEXT,
    "description" TEXT,
    "panGst" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "headOfficeAddress" TEXT,
    "branchOffices" JSONB,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "registrationStep" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "hrAndRecruiterName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fcmToken" TEXT,
    "emailOtp" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailOtpExpiry" TIMESTAMP(3),
    "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailOtpBlockedUntil" TIMESTAMP(3),
    "mobileOtp" TEXT,
    "isMobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobileOtpExpiry" TIMESTAMP(3),
    "mobileOtpAttempts" INTEGER NOT NULL DEFAULT 0,
    "mobileOtpBlockedUntil" TIMESTAMP(3),
    "logo" TEXT,
    "smallLogo" TEXT,
    "industryType" TEXT,
    "companySize" TEXT,
    "companyIntro" TEXT,
    "foundedYear" TEXT,
    "panOrGst" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "address" TEXT,
    "branchLocation" JSONB,
    "linkdinUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "websiteUrl" TEXT,
    "rejectReason" TEXT,
    "AiScore" INTEGER NOT NULL DEFAULT 0,
    "forgotPasswordAttemts" INTEGER NOT NULL DEFAULT 0,
    "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "companyStatus" "public"."CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_update_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "hrAndRecruiterName" TEXT,
    "countryCode" TEXT,
    "phoneNumber" TEXT,
    "industryType" TEXT,
    "companySize" TEXT,
    "companyIntro" TEXT,
    "foundedYear" TEXT,
    "panOrGst" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "address" TEXT,
    "branchLocation" TEXT[],
    "linkdinUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "websiteUrl" TEXT,
    "AiScore" TEXT,
    "logo" TEXT,
    "smallLogo" TEXT,
    "companyStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectedReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "company_update_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_categories" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_sub_categories" (
    "id" TEXT NOT NULL,
    "subCategoryName" TEXT NOT NULL,
    "jobCategoryId" TEXT NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "jobCategoryId" TEXT NOT NULL,
    "jobSubCategoryId" TEXT NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobCategoryId" TEXT NOT NULL,
    "jobSubCategoryId" TEXT NOT NULL,
    "internshipDuration" TEXT NOT NULL,
    "workingHours" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "skills" JSONB NOT NULL,
    "aboutJob" TEXT NOT NULL,
    "otherRequirements" TEXT NOT NULL,
    "numberOfOpenings" INTEGER NOT NULL,
    "stipend" "public"."StipendValue" NOT NULL DEFAULT 'NO',
    "minStipend" INTEGER,
    "maxStipend" INTEGER,
    "additionalBenefits" JSONB NOT NULL,
    "rejectReason" TEXT,
    "jobActiveDate" TIMESTAMP(3),
    "jobExpireDate" TIMESTAMP(3),
    "jobDaysActive" INTEGER,
    "experience" TEXT,
    "resumeAccessCredits" INTEGER DEFAULT 0,
    "appliedCandidates" INTEGER NOT NULL DEFAULT 0,
    "subscriptionId" TEXT,
    "applicationType" "public"."ApplicationType" NOT NULL DEFAULT 'INTERNSHIP',
    "jobType" "public"."JobType" NOT NULL DEFAULT 'OFFICE',
    "jobStatus" "public"."JobStatus" NOT NULL DEFAULT 'REVIEW',
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employmentType" "public"."WorkMode" NOT NULL DEFAULT 'ANY',

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "actualPrice" INTEGER NOT NULL,
    "discountedPrice" INTEGER NOT NULL,
    "numberOfJobPosting" INTEGER NOT NULL,
    "numberOfResumeAccess" INTEGER NOT NULL,
    "jobDaysActive" INTEGER NOT NULL,
    "expireDaysPackage" INTEGER NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_management" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "isJoined" BOOLEAN NOT NULL DEFAULT false,
    "candidateStatus" "public"."CandidateStatus" NOT NULL DEFAULT 'SHORTLISTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_subscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "jobPostingCredits" INTEGER NOT NULL,
    "resumeAccessCredits" INTEGER NOT NULL,
    "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEnd" TIMESTAMP(3) NOT NULL,
    "jobDaysActive" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_history" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "paymentStatus" TEXT,
    "razorpay_order_id" TEXT,
    "razorpay_signature" TEXT,
    "razorpay_payment_id" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "public"."SupportStatus" NOT NULL DEFAULT 'OPEN',
    "phoneNumber" TEXT NOT NULL,
    "isRepliedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "countryCode" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "attachment" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_messages" (
    "id" TEXT NOT NULL,
    "message" TEXT,
    "supportId" TEXT NOT NULL,
    "isRepliedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "attachment" TEXT,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."downloaded_resumes" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "resumeStatus" "public"."ResumeStatus" NOT NULL DEFAULT 'REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "downloaded_resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."intern_notifications" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intern_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_category" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_tag" (
    "id" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "blogCategoryId" TEXT NOT NULL,
    "blogTagIds" JSONB NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "slug" TEXT,
    "altTag" TEXT,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledDate" TIMESTAMP(3),
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_us" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_us_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."intern_otps" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "otpExpiry" TIMESTAMP(3) NOT NULL,
    "isVerifies" BOOLEAN NOT NULL DEFAULT false,
    "otpVerifyAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpVerifyBlockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intern_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interview" (
    "id" TEXT NOT NULL,
    "candidateManagementId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "interviewType" "public"."InterViewType" NOT NULL DEFAULT 'OFFLINE',
    "interviewDate" TEXT NOT NULL,
    "interviewTime" TEXT NOT NULL,
    "interviewLink" TEXT,
    "interviewLocation" TEXT,
    "interviewStatus" TEXT,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_InternsToSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InternsToSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PreferredState" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreferredState_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_jobState" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_jobState_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PreferredLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreferredLocations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_jobCity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_jobCity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_BlogTagsRelation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogTagsRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_id_key" ON "public"."admins"("id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "public"."admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "interns_id_key" ON "public"."interns"("id");

-- CreateIndex
CREATE UNIQUE INDEX "interns_email_key" ON "public"."interns"("email");

-- CreateIndex
CREATE UNIQUE INDEX "interns_mobileNumber_key" ON "public"."interns"("mobileNumber");

-- CreateIndex
CREATE INDEX "interns_email_isDelete_id_applicationType_isProfileComplate_idx" ON "public"."interns"("email", "isDelete", "id", "applicationType", "isProfileComplate", "isOpenToWork", "isResumeActive", "isResumeDeleted", "industry", "internStatus", "internshipType");

-- CreateIndex
CREATE UNIQUE INDEX "companies_id_key" ON "public"."companies"("id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "public"."companies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_phoneNumber_key" ON "public"."companies"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_id_key" ON "public"."job_categories"("id");

-- CreateIndex
CREATE INDEX "job_categories_isDelete_id_idx" ON "public"."job_categories"("isDelete", "id");

-- CreateIndex
CREATE INDEX "job_categories_id_idx" ON "public"."job_categories"("id");

-- CreateIndex
CREATE INDEX "job_categories_createdAt_isDelete_idx" ON "public"."job_categories"("createdAt", "isDelete");

-- CreateIndex
CREATE INDEX "job_categories_categoryName_isDelete_idx" ON "public"."job_categories"("categoryName", "isDelete");

-- CreateIndex
CREATE UNIQUE INDEX "job_sub_categories_id_key" ON "public"."job_sub_categories"("id");

-- CreateIndex
CREATE INDEX "job_sub_categories_isDelete_id_idx" ON "public"."job_sub_categories"("isDelete", "id");

-- CreateIndex
CREATE INDEX "job_sub_categories_id_idx" ON "public"."job_sub_categories"("id");

-- CreateIndex
CREATE INDEX "job_sub_categories_createdAt_isDelete_idx" ON "public"."job_sub_categories"("createdAt", "isDelete");

-- CreateIndex
CREATE INDEX "job_sub_categories_subCategoryName_isDelete_idx" ON "public"."job_sub_categories"("subCategoryName", "isDelete");

-- CreateIndex
CREATE UNIQUE INDEX "skills_id_key" ON "public"."skills"("id");

-- CreateIndex
CREATE INDEX "skills_isDelete_id_idx" ON "public"."skills"("isDelete", "id");

-- CreateIndex
CREATE INDEX "skills_id_idx" ON "public"."skills"("id");

-- CreateIndex
CREATE INDEX "skills_createdAt_isDelete_idx" ON "public"."skills"("createdAt", "isDelete");

-- CreateIndex
CREATE INDEX "skills_skillName_isDelete_idx" ON "public"."skills"("skillName", "isDelete");

-- CreateIndex
CREATE INDEX "skills_jobCategoryId_isDelete_idx" ON "public"."skills"("jobCategoryId", "isDelete");

-- CreateIndex
CREATE INDEX "skills_jobSubCategoryId_isDelete_idx" ON "public"."skills"("jobSubCategoryId", "isDelete");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_id_key" ON "public"."jobs"("id");

-- CreateIndex
CREATE INDEX "jobs_companyId_jobStatus_isDelete_idx" ON "public"."jobs"("companyId", "jobStatus", "isDelete");

-- CreateIndex
CREATE INDEX "jobs_jobStatus_isDelete_idx" ON "public"."jobs"("jobStatus", "isDelete");

-- CreateIndex
CREATE INDEX "jobs_companyId_isDelete_idx" ON "public"."jobs"("companyId", "isDelete");

-- CreateIndex
CREATE INDEX "jobs_jobStatus_createdAt_isDelete_idx" ON "public"."jobs"("jobStatus", "createdAt", "isDelete");

-- CreateIndex
CREATE INDEX "jobs_companyId_createdAt_isDelete_idx" ON "public"."jobs"("companyId", "createdAt", "isDelete");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_id_key" ON "public"."subscriptions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_management_id_key" ON "public"."candidate_management"("id");

-- CreateIndex
CREATE INDEX "candidate_management_internId_jobId_companyId_isDelete_idx" ON "public"."candidate_management"("internId", "jobId", "companyId", "isDelete");

-- CreateIndex
CREATE INDEX "candidate_management_internId_jobId_companyId_idx" ON "public"."candidate_management"("internId", "jobId", "companyId");

-- CreateIndex
CREATE INDEX "candidate_management_internId_jobId_isDelete_idx" ON "public"."candidate_management"("internId", "jobId", "isDelete");

-- CreateIndex
CREATE INDEX "candidate_management_internId_isDelete_idx" ON "public"."candidate_management"("internId", "isDelete");

-- CreateIndex
CREATE INDEX "candidate_management_jobId_companyId_isDelete_idx" ON "public"."candidate_management"("jobId", "companyId", "isDelete");

-- CreateIndex
CREATE INDEX "candidate_management_jobId_isDelete_idx" ON "public"."candidate_management"("jobId", "isDelete");

-- CreateIndex
CREATE INDEX "candidate_management_companyId_isDelete_idx" ON "public"."candidate_management"("companyId", "isDelete");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscription_id_key" ON "public"."company_subscription"("id");

-- CreateIndex
CREATE INDEX "company_subscription_companyId_isActive_idx" ON "public"."company_subscription"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "company_subscription_companyId_idx" ON "public"."company_subscription"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_history_id_key" ON "public"."payment_history"("id");

-- CreateIndex
CREATE UNIQUE INDEX "support_id_key" ON "public"."support"("id");

-- CreateIndex
CREATE UNIQUE INDEX "support_messages_id_key" ON "public"."support_messages"("id");

-- CreateIndex
CREATE UNIQUE INDEX "downloaded_resumes_id_key" ON "public"."downloaded_resumes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso2_key" ON "public"."countries"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "states_iso2_key" ON "public"."states"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_id_key" ON "public"."notifications"("id");

-- CreateIndex
CREATE UNIQUE INDEX "intern_notifications_id_key" ON "public"."intern_notifications"("id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_id_key" ON "public"."blog_category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_categoryName_key" ON "public"."blog_category"("categoryName");

-- CreateIndex
CREATE INDEX "blog_category_categoryName_idx" ON "public"."blog_category"("categoryName");

-- CreateIndex
CREATE INDEX "blog_category_id_idx" ON "public"."blog_category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tag_id_key" ON "public"."blog_tag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tag_tagName_key" ON "public"."blog_tag"("tagName");

-- CreateIndex
CREATE INDEX "blog_tag_tagName_idx" ON "public"."blog_tag"("tagName");

-- CreateIndex
CREATE INDEX "blog_tag_id_idx" ON "public"."blog_tag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_id_key" ON "public"."blog"("id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_us_id_key" ON "public"."contact_us"("id");

-- CreateIndex
CREATE UNIQUE INDEX "intern_otps_id_key" ON "public"."intern_otps"("id");

-- CreateIndex
CREATE UNIQUE INDEX "intern_otps_mobileNumber_key" ON "public"."intern_otps"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "interview_id_key" ON "public"."interview"("id");

-- CreateIndex
CREATE INDEX "_InternsToSkills_B_index" ON "public"."_InternsToSkills"("B");

-- CreateIndex
CREATE INDEX "_PreferredState_B_index" ON "public"."_PreferredState"("B");

-- CreateIndex
CREATE INDEX "_jobState_B_index" ON "public"."_jobState"("B");

-- CreateIndex
CREATE INDEX "_PreferredLocations_B_index" ON "public"."_PreferredLocations"("B");

-- CreateIndex
CREATE INDEX "_jobCity_B_index" ON "public"."_jobCity"("B");

-- CreateIndex
CREATE INDEX "_BlogTagsRelation_B_index" ON "public"."_BlogTagsRelation"("B");

-- AddForeignKey
ALTER TABLE "public"."interns" ADD CONSTRAINT "interns_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interns" ADD CONSTRAINT "interns_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interns" ADD CONSTRAINT "interns_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_industryType_fkey" FOREIGN KEY ("industryType") REFERENCES "public"."job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_update_requests" ADD CONSTRAINT "company_update_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_sub_categories" ADD CONSTRAINT "job_sub_categories_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "public"."job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skills" ADD CONSTRAINT "skills_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "public"."job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skills" ADD CONSTRAINT "skills_jobSubCategoryId_fkey" FOREIGN KEY ("jobSubCategoryId") REFERENCES "public"."job_sub_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "public"."job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_jobSubCategoryId_fkey" FOREIGN KEY ("jobSubCategoryId") REFERENCES "public"."job_sub_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_management" ADD CONSTRAINT "candidate_management_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_management" ADD CONSTRAINT "candidate_management_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_management" ADD CONSTRAINT "candidate_management_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_subscription" ADD CONSTRAINT "company_subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_subscription" ADD CONSTRAINT "company_subscription_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_history" ADD CONSTRAINT "payment_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_history" ADD CONSTRAINT "payment_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support" ADD CONSTRAINT "support_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_messages" ADD CONSTRAINT "support_messages_supportId_fkey" FOREIGN KEY ("supportId") REFERENCES "public"."support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."downloaded_resumes" ADD CONSTRAINT "downloaded_resumes_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."downloaded_resumes" ADD CONSTRAINT "downloaded_resumes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."states" ADD CONSTRAINT "states_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("iso2") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."states"("iso2") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "cities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("iso2") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."intern_notifications" ADD CONSTRAINT "intern_notifications_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blog" ADD CONSTRAINT "blog_blogCategoryId_fkey" FOREIGN KEY ("blogCategoryId") REFERENCES "public"."blog_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview" ADD CONSTRAINT "interview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview" ADD CONSTRAINT "interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview" ADD CONSTRAINT "interview_internId_fkey" FOREIGN KEY ("internId") REFERENCES "public"."interns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview" ADD CONSTRAINT "interview_candidateManagementId_fkey" FOREIGN KEY ("candidateManagementId") REFERENCES "public"."candidate_management"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InternsToSkills" ADD CONSTRAINT "_InternsToSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."interns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_InternsToSkills" ADD CONSTRAINT "_InternsToSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PreferredState" ADD CONSTRAINT "_PreferredState_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."interns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PreferredState" ADD CONSTRAINT "_PreferredState_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_jobState" ADD CONSTRAINT "_jobState_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_jobState" ADD CONSTRAINT "_jobState_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PreferredLocations" ADD CONSTRAINT "_PreferredLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PreferredLocations" ADD CONSTRAINT "_PreferredLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."interns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_jobCity" ADD CONSTRAINT "_jobCity_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_jobCity" ADD CONSTRAINT "_jobCity_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BlogTagsRelation" ADD CONSTRAINT "_BlogTagsRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BlogTagsRelation" ADD CONSTRAINT "_BlogTagsRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."blog_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
