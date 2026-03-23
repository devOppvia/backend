const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const jobManagementServices = require("../../services/JobManagement/JobManagement.service");
const jobCategoryServices = require("../../services/JobCategory/jobCategory.service");
const jobSubCategoryServices = require("../../services/JobSubCategory/jobSubCategory.service");
const companyRegistrationServices = require("../../services/CompanyAuth/companyAuth.service");
const axios = require("axios");
const validator = require("validator");
const { generateJobPrompt, generateJobOtherRequirementsPrompt } = require("../../helpers/generateJobAboutPrompt");
const { sendJobStatusMail } = require("../../helpers/sendMail");
const {
  sendWebPushNotification,
} = require("../../helpers/WebPushNotification/notificationHelper");
const prisma = require("../../config/database");
const { generateJobTitles, generateJobText, generateSubCategory } = require("../../helpers/generateRoleTitle");

exports.submitJobOpening = async (req, res) => {
  try {
    let {
      companyId,
      jobTitle,
      jobCategoryId,
      jobSubCategoryId,
      internshipDuration,
      workingHours,
      skills,
      aboutJob,
      otherRequirements,
      numberOfOpenings,
      state,
      city,
      stipend,
      additionalBenefits,
      jobType,
      jobStatus,
      minStipend,
      maxStipend,
      subscriptionId,
      applicationType = "INTERNSHIP",
      experience
    } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company Id is required", 400);
    }
    if(!city || !state) {
      return errorResponse(res, "Location is required", 400);
    }
    if (!jobTitle) {
      return errorResponse(res, "Job title is required", 400);
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Job category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "Job subCategory id is required", 400);
    }
    if (!internshipDuration) {
      return errorResponse(res, "Internshi duration is required", 400);
    }
    if (!workingHours) {
      return errorResponse(res, "Working hours is required", 400);
    }
    if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(skills)) {
      return errorResponse(res, "Skills must be in Array format", 400);
    }
    if (!aboutJob) {
      return errorResponse(res, "About is the required", 400);
    }
    if (!numberOfOpenings) {
      return errorResponse(res, "Number of Openings is required", 400);
    }
    if (numberOfOpenings < 1 || numberOfOpenings > 10000) {
      return res.status(400).json({
        message: "Number of openings must be between 1 and 10,000."
      });
    }
    // if (!location) {
    //   return errorResponse(res, "Location is required", 400);
    // }
    if (!stipend) {
      return errorResponse(res, "Stipend is required", 400);
    }
    if (stipend) {
      let validValueOfStipend = ["YES", "NO"];
      if (!validValueOfStipend.includes(stipend)) {
        return errorResponse(res, "Enter valid status of stipend", 400);
      }
    }
    if (stipend === "YES") {
      if (!minStipend) {
        return errorResponse(res, "Stipend min value is required", 400);
      }
      if (!maxStipend) {
        return errorResponse(res, "Stipend max value is required", 400);
      }
      const min = Number(minStipend);
      const max = Number(maxStipend);

      if (isNaN(min) || isNaN(max)) {
        return errorResponse(res, "Stipend values must be valid numbers", 400);
      }

      if (min < 0 || max < 0) {
        return errorResponse(res, "Stipend values must be greater than 0", 400);
      }

      if (min > max) {
        return errorResponse(
          res,
          "Stipend min value cannot be greater than max value",
          400
        );
      }
      if (min === max) {
        return errorResponse(
          res,
          "Stipend min and max values are not same",
          400
        );
      }
    }
    if (!jobType) {
      return errorResponse(res, "Job type is required", 400);
    }
    if (jobType) {
      let validType = ["REMOTE", "HYBRID", "OFFICE"];
      if (!validType.includes(jobType)) {
        return errorResponse(res, "Please enter job type");
      }
    }
    if (!additionalBenefits) {
      return errorResponse(res, "Additional benefits is required", 400);
    }
    if (!Array.isArray(additionalBenefits)) {
      return errorResponse(res, "Additional benefits is in array format", 400);
    }
    if (jobStatus) {
      let validStatus = ["DRAFT"];
      if (!validStatus.includes(jobStatus)) {
        return errorResponse(res, "Only Draft satatus allowed", 400);
      }
    }
    if(!applicationType){
      return errorResponse(res, "Application type is required", 400)
    }
    if(!["JOB","INTERNSHIP"].includes(applicationType)){
      return errorResponse(res, "Please enter valid application type", 400)
    }
    if(applicationType === "JOB"){
      if(!experience){
        return errorResponse(res, "Experience is required", 400)
      }
    }
    let existingJobCategory = await jobCategoryServices.getJobCategoryBasedOnId(
      jobCategoryId
    );
    if (!existingJobCategory) {
      return errorResponse(res, "Job Category not found", 400);
    }
    let existingJobSubCategory =
      await jobSubCategoryServices.getSubCategoryForJobCreateBasedOnId(
        jobSubCategoryId
      );
    if (!existingJobSubCategory) {
      return errorResponse(res, "Job SubCategory not found", 400);
    }
    let existingCompany = await companyRegistrationServices.fetchCompanyById(
      companyId
    );
    if (!existingCompany) {
      return errorResponse(res, "Company does not exist", 400);
    }
    if (subscriptionId) {
      if (!validator.isUUID(subscriptionId)) {
        return errorResponse(res, "Please enter valid subscription id", 400);
      }
    }
    await jobManagementServices.submitJobOpening(req.body);
    return successResponse(res, {}, "Job Submitted For the review");
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};


exports.getJobsBasedOnStatus = async (req, res) => {
  try {
    let {
      jobStatus,
      companyId,
      jobCategoryId,
      jobSubCategoryId,
      startDate,
      endDate,
      itemsPerPage = 10,
      currentPage = 2,
      search,
    } = req.body || {};
    if (jobStatus) {
      let validStatus = [
        "REVIEW",
        "APPROVED",
        "PAUSED",
        "COMPLETED",
        "REJECTED",
        "DRAFT",
      ];
      if (!validStatus.includes(jobStatus)) {
        return errorResponse(res, "Please enter valid status", 400);
      }
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (jobCategoryId) {
      let existingJobCategory =
        await jobCategoryServices.getJobCategoryBasedOnId(jobCategoryId);
      if (!existingJobCategory) {
        return errorResponse(res, "Job category does not exist", 400);
      }
    }
    if (jobSubCategoryId) {
      let existingJobSubCategory =
        await jobSubCategoryServices.getSubCategoryBasedOnId(jobSubCategoryId);
      if (!existingJobSubCategory) {
        return errorResponse(res, "Job sub category does not exist", 400);
      }
    }
    let existingJobs = await jobManagementServices.getJobsBasedOnStatus(
      jobStatus,
      companyId,
      jobCategoryId,
      jobSubCategoryId,
      startDate,
      endDate,
      itemsPerPage,
      currentPage,
      search
    );
    return successResponse(
      res,
      existingJobs.jobs,
      "Job fetched successfully",
      existingJobs.pagination
    );
  } catch (error) {
    console.log("error : " , error)
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobsBasedOnStatusForAdmin = async (req, res) => {
  try {
    let { jobStatus, currentPage = 1, itemsPerPage = 9 } = req.body || {};
    if (jobStatus) {
      let validStatus = [
        "REVIEW",
        "APPROVED",
        "PAUSED",
        "COMPLETED",
        "REJECTED",
        "DRAFT",
      ];
      if (!validStatus.includes(jobStatus)) {
        return errorResponse(res, "Please enter valid status", 400);
      }
    }
    let existingJobs = await jobManagementServices.getJobsBasedOnStatusForAdmin(
      jobStatus,
      currentPage,
      itemsPerPage
    );
    return successResponse(res, existingJobs, "Job fetched successfully");
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getTheSuggentionFromAiForJobDescription = async (req, res) => {
  try {
    let jobCategory = "Information Technology";
    let jobSubCategory = "Web Development";
    let skills = [
      "NODE JS",
      "EXPRESS JS",
      "JAVASCRIPT",
      "REACTJS",
      "MONGODB",
      "POSTGRAY SQL",
    ];
    let jobTitle = "FULL STACK DEVELOPER";
    let internshipDuration = "3 Month";
    let workingHours = "Full time";
    const jobPrompt = `
You are an expert HR content creator specializing in internships. Your task is to generate unique internship posting content every time, so the descriptions should not repeat exact wording across different requests. Vary the writing style, phrasing, and examples while keeping the meaning accurate.

Details of the internship:
- Job Title: ${jobTitle}
- Category: ${jobCategory}
- Subcategory: ${jobSubCategory}
- Internship Duration: ${internshipDuration}
- Working Hours: ${workingHours}
- Required Skills: ${skills.join(", ")}

Output rules:
1. Write the result in **strict JSON format** with exactly two fields:
{
  "aboutJob": "A professional yet student-friendly description (max 180 words) explaining what interns will do, the kind of projects/tasks, learning opportunities, and career benefits.",
  "otherRequirements": "A concise bullet-point list (max 6 points) covering eligibility, soft skills, professional qualities, and any extra expectations."
}
2. Always use varied sentence structures, examples, and tones to keep the response fresh.
3. Do not include anything outside this JSON. Do not add comments, explanations, or extra text.
4. Each response must feel like a new posting, even with the same inputs.
`;
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages: [{ role: "user", content: jobPrompt }],
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer a56fd063419284b27b4322bedf2a5ede14924993cf6fe284b204295b0589f893`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawText = response.data.choices[0].message.content;

    let aboutJob = "";
    let otherRequirements = "";

    try {
      const parsed = JSON.parse(rawText);
      aboutJob = parsed.aboutJob;
      otherRequirements = parsed.otherRequirements;
    } catch (e) {
      console.error("Failed to parse response:", rawText);
    }
    return successResponse(res, {}, "", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobDetails = async (req, res) => {
  try {
    let { jobId } = req.params || {};
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    let existingJobCheck = await jobManagementServices.fetcheJobBasedOnId(
      jobId
    );
    if (!existingJobCheck) {
      return errorResponse(res, "Job does not exist", 400);
    }
    let existingJob = await jobManagementServices.getJobDetails(jobId);
    return successResponse(res, existingJob, "Job fetched successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteJobDetailsByCompanys = async (req, res) => {
  try {
    let { jobId } = req.params || {};
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    let existingJobCheck = await jobManagementServices.getJobBasedOnId(jobId);
    if (!existingJobCheck) {
      return errorResponse(res, "Job does not exist", 400);
    }
    await jobManagementServices.deleteJobDetailsByCompany(jobId);
    return successResponse(res, {}, "Job deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    let { jobId ,  } = req.params || {};
    let { jobStatus, reason ,subscriptionPlanId } = req.body || {};
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    if (!jobStatus) {
      return errorResponse(res, "Job status is required", 400);
    }
    if(jobStatus === "REVIEW"){
      if(!subscriptionPlanId){
        return errorResponse(res, "Subscription plan id is required", 400);
      }

      let existingSubscriptionPlan = await prisma.subscription.findFirst({
        where: {
          id: subscriptionPlanId,
        },
      });
      if (!existingSubscriptionPlan) {
        return errorResponse(res, "Subscription plan does not exist", 404);
      }
    }
    if (jobStatus) {
      let validStatus = [
        "REVIEW",
        "APPROVED",
        "PAUSED",
        "COMPLETED",
        "REJECTED",
      ];
      if (!validStatus.includes(jobStatus)) {
        return errorResponse(res, "Please enter valid status", 400);
      }
    }
    let existingJobCheck = await jobManagementServices.fetcheJobBasedOnId(
      jobId
    );
    if (!existingJobCheck) {
      return errorResponse(res, "Job does not exist", 404);
    }
    let { companyId } = existingJobCheck;
    let company = await companyRegistrationServices.fetchCompanyById(companyId);
    const { email, companyName, fcmToken } = company || {};
    const { jobTitle } = existingJobCheck || {};
    if(fcmToken){
      let title = "Job Status";
      let body = `Your job ${jobTitle} is ${jobStatus}`;
      await sendWebPushNotification(fcmToken,title,body)
      await prisma.notification.create({
        data : {
          companyId : companyId,
          title : title,
          message : body
        }
      })
    }
    await sendJobStatusMail({
      email,
      jobTitle,
      companyName,
      jobStatus,
      reason,
    });
    let jobExpireDate;
    let jobActiveDate = new Date();
    let jobDaysActive;
    let existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
      },
    });
    let { subscriptionId } = existingJob || {};
    if (jobStatus === "APPROVED") {
    
      if (subscriptionId) {
        let existingSubscription = await prisma.subscription.findFirst({
          where: {
            id: subscriptionId,
          },
        });
        let { jobDaysActive } = existingSubscription || {};
        jobExpireDate = new Date(jobActiveDate);
        jobExpireDate.setDate(jobExpireDate.getDate() + (jobDaysActive || 0));
        jobDaysActive = jobDaysActive || 0;
        let currentPackage = await prisma.companySubscription.findFirst({
          where: {
            subscriptionId: subscriptionId,
            isActive: true,
          },
          orderBy : {
            createdAt : "desc"
          }
        });
        if (currentPackage) {
          await prisma.companySubscription.update({
            where: {
              id: currentPackage.id,
            },
            data: {
              jobDaysActive: jobDaysActive,
            },
          });
        }
      } else {
        jobExpireDate = new Date(jobActiveDate);
        jobExpireDate.setDate(jobExpireDate.getDate() + (3 || 0));
        jobDaysActive = 3;
      }
    }
    if(jobStatus === "REJECTED"){
      if(subscriptionId){
        let currentPackage = await prisma.companySubscription.findFirst({
          where : {
            subscriptionId : subscriptionId,
            isActive : true
          },
          select : {
            id : true,
            subscriptionId : true
          },
          orderBy : {
            createdAt : "desc"
          }
        })
        if(currentPackage){
          await prisma.companySubscription.update({
            where : {
              id : currentPackage.id
            },
            data : {
              jobPostingCredits : {
                increment : 1
              }
            }
          })
        }
      }
    }


    await jobManagementServices.updateJobStatus(
      jobId,
      jobStatus,
      reason,
      jobActiveDate,
      jobExpireDate,
      jobDaysActive,
      subscriptionPlanId
    );
    return successResponse(res, {}, "Job status updated successfully", {}, 200);
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateJobDetails = async (req, res) => {
  try {
    let { jobId } = req.params || {};
    let {
      companyId,
      jobTitle,
      jobCategoryId,
      jobSubCategoryId,
      internshipDuration,
      workingHours,
      skills,
      aboutJob,
      otherRequirements,
      numberOfOpenings,
      location,
      stipend,
      additionalBenefits,
      jobType,
      minStipend,
      maxStipend,
      jobStatus,
    } = req.body || {};
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    let existingJobCheck = await jobManagementServices.getJobBasedOnId(jobId);
    if (!existingJobCheck) {
      return errorResponse(res, "Job does not exist", 404);
    }
    if (!companyId) {
      return errorResponse(res, "Company Id is required", 400);
    }
    if (!jobTitle) {
      return errorResponse(res, "Job title is required", 400);
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Job category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "Job subCategory id is required", 400);
    }
    if (!internshipDuration) {
      return errorResponse(res, "Internshi duration is required", 400);
    }
    if (!workingHours) {
      return errorResponse(res, "Working hours is required", 400);
    }
    if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(skills)) {
      return errorResponse(res, "Skills must be in Array format", 400);
    }
    if (!skills || skills.length === 0) {
      return errorResponse(res, "Skills must be at least one", 400);
    }

    if (!aboutJob) {
      return errorResponse(res, "About is the required", 400);
    }
    if (!numberOfOpenings) {
      return errorResponse(res, "Number of Openings is required", 400);
    }
    if (!location) {
      return errorResponse(res, "Location is required", 400);
    }
    if (!stipend) {
      return errorResponse(res, "Stipend is required", 400);
    }
    if (!jobType) {
      return errorResponse(res, "Job type is required");
    }
    if (jobType) {
      let validType = ["REMOTE", "HYBRID", "OFFICE"];
      if (!validType.includes(jobType)) {
        return errorResponse(res, "Please enter job type");
      }
    }
    if (!additionalBenefits) {
      return errorResponse(res, "Additional benefits is required", 400);
    }
    if (!Array.isArray(additionalBenefits)) {
      return errorResponse(res, "Additional benefits is in array format", 400);
    }
    await jobManagementServices.updateJobDetails(jobId, req.body);
    return successResponse(res, {}, "Job updated successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCompanyLocations = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (companyId) {
      if (!validator.isUUID(companyId)) {
        return errorResponse(res, "Invalid company id", 400);
      }
    }
    let existingLocations = await jobManagementServices.getCompanyLocations(
      companyId
    );
    let { address, branchLocation } = existingLocations;
    let locations = [];
    locations.push(address);
    if (branchLocation) {
      locations.push(...branchLocation);
    }
    return successResponse(
      res,
      locations,
      "Company locations fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.generateJobAbout = async (req, res) => {
  try {
    let {
      title,
      jobCategoryId,
      jobSubCategoryId,
      skills,
      duration,
      workingHours,
      workType,
      location,
      internsRequired,
      stipend,
        additionalBenefits,
    } = req.body || {};
    if (!title) {
      return errorResponse(res, "Postion title is required", 400);
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Job Category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "Job SubCategory id is required", 400);
    }
    if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(skills)) {
      return errorResponse(res, "Skills must be in array format", 400);
    }
    if (skills.length === 0) {
      return errorResponse(res, "Min one skill is required", 400);
    }
    if (!duration) {
      return errorResponse(res, "Duration is required", 400);
    }
    if (!workingHours) {
      return errorResponse(res, "Working hours is required", 400);
    }
    if (!workType) {
      return errorResponse(res, "Internship type is required");
    }
    if (!location) {
      return errorResponse(res, "Location is required", 400);
    }
    if (!internsRequired) {
      return errorResponse(res, "Number of interns required", 400);
    }
    // if (stipend) {
    //   let validStatus = ["Paid", "Unpaid" , "Fixed"];
    //   if (!validStatus.includes(stipend.type)) {
    //     return errorResponse(res, "Invalid stipend type");
    //   }
    // }
    if (stipend.type === "Paid") {
      if (!stipend.minAmount || !stipend.maxAmount) {
        return errorResponse(res, "Min and Max stipend is required");
      }
      if (Number(stipend.minAmount) > Number(stipend.maxAmount)) {
        return errorResponse(
          res,
          "Min stipend cannot be greater than Max stipend"
        );
      }
    }
    if (additionalBenefits) {
      if (!Array.isArray(additionalBenefits)) {
        return errorResponse(
          res,
          "Additional benefits must be in array format",
          400
        );
      }
    }
    let body = {
      positionTitle: title,
      category: jobCategoryId,
      subCategory: jobCategoryId,
      skillsRequired: skills,
      duration: duration,
      workingHours: workingHours,
      internshipType: workType,
      location: location,
      numberOfInterns: internsRequired,
      stipend: stipend,
      additionalBenefits: additionalBenefits,
    };
    let prompt = generateJobPrompt(body);
    
    // let description = await jobManagementServices.generateJobAbout(prompt);
    let description = await generateJobText(prompt)

    return successResponse(
      res,
      description,
      "Prompt Generated successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};





exports.generateJobOtherRequirements = async (req, res) => {
  try {
    let {
      title,
      jobCategoryId,
      jobSubCategoryId,
      skills,
      duration,
      workingHours,
      workType,
      location,
      internsRequired,
      stipend,
        additionalBenefits,
      otherInfo
    } = req.body || {};
    if (!otherInfo || otherInfo.trim() === "") {
      return errorResponse(res, "Other info is required", 400);
    }
    if(!otherInfo.trim().length > 20){
      return errorResponse(res, "Other info must be at least 20 characters long", 400);
    }
    if (!title) {
      return errorResponse(res, "Postion title is required", 400);
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Job Category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "Job SubCategory id is required", 400);
    }
    if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(skills)) {
      return errorResponse(res, "Skills must be in array format", 400);
    }
    if (skills.length === 0) {
      return errorResponse(res, "Min one skill is required", 400);
    }
    if (!duration) {
      return errorResponse(res, "Duration is required", 400);
    }
    if (!workingHours) {
      return errorResponse(res, "Working hours is required", 400);
    }
    if (!workType) {
      return errorResponse(res, "Internship type is required");
    }
    if (!location) {
      return errorResponse(res, "Location is required", 400);
    }
    if (!internsRequired) {
      return errorResponse(res, "Number of interns required", 400);
    }
    // if (stipend) {
    //   let validStatus = ["Paid", "Unpaid"];
    //   if (!validStatus.includes(stipend.type)) {
    //     return errorResponse(res, "Invalid stipend type");
    //   }
    // }
    if (stipend.type === "Paid") {
      if (!stipend.minAmount || !stipend.maxAmount) {
        return errorResponse(res, "Min and Max stipend is required");
      }
      if (Number(stipend.minAmount) > Number(stipend.maxAmount)) {
        return errorResponse(
          res,
          "Min stipend cannot be greater than Max stipend"
        );
      }
    }
    if (additionalBenefits) {
      if (!Array.isArray(additionalBenefits)) {
        return errorResponse(
          res,
          "Additional benefits must be in array format",
          400
        );
      }
    }
    let body = {
      positionTitle: title,
      category: jobCategoryId,
      subCategory: jobCategoryId,
      skillsRequired: skills,
      duration: duration,
      workingHours: workingHours,
      internshipType: workType,
      location: location,
      numberOfInterns: internsRequired,
      stipend: stipend,
      additionalBenefits: additionalBenefits,
      otherInfo: otherInfo,
    };
    let prompt = generateJobOtherRequirementsPrompt(body);
    
    // let description = await jobManagementServices.generateJobAbout(prompt);
    let description = await generateJobText(prompt)

    return successResponse(
      res,
      description,
      "Prompt Generated successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};




exports.updateJobBulkStatusUpdate = async (req, res) => {
  try {
    let { status, jobIds } = req.body || {};
    if (!status) {
      return errorResponse(res, "Status is required", 400);
    }
    if (!jobIds) {
      return errorResponse(res, "Job ids is required", 400);
    }
    if (!Array.isArray(jobIds)) {
      return errorResponse(res, "Job ids must be in array format");
    }
    for (let jobId of jobIds) {
      let existingJobCheck = await jobManagementServices.fetcheJobBasedOnId(
        jobId
      );
      if (!existingJobCheck) {
        return errorResponse(res, "Job does not exist", 404);
      }
      let { companyId } = existingJobCheck;
      let company = await companyRegistrationServices.fetchCompanyById(
        companyId
      );
      const { email, companyName, fcmToken } = company || {};
      const { jobTitle } = existingJobCheck || {};
      await sendJobStatusMail({
        email,
        jobTitle,
        companyName,
        jobStatus: status,
        reason: "",
      });
      if (fcmToken) {
        let title = "Job Status";
        let body = `Your job ${jobTitle} is ${status}`;
        await sendWebPushNotification(fcmToken, title, body);
        await prisma.notification.create({
          data: {
            companyId: companyId,
            title: title,
            message: body,
          },
        });
      }
    }

    await jobManagementServices.updateJobBulkStatus(status, jobIds);
    return successResponse(res, {}, "Status updated successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.generateRoleTitle = async (req, res)=>{
  try {
    let { category, subCategory ,applicationType} = req.body || {}
    if(!category){
      return errorResponse(res, "Category is required", 400)
    }
    if(!subCategory){
      return errorResponse(res, "SubCategory is required", 400)
    }
    // if(!validator.isUUID(category)){
    //   return errorResponse(res, "Invalid industry id format", 400)
    // }
    // if(!validator.isUUID(subCategory)){
    //   return errorResponse(res, "Invalid department id format", 400)
    // }
    if(!applicationType){
      return errorResponse(res, "Type is required", 400)
    }
  //   let existingIndustry = await prisma.jobCategory.findFirst({
  //     where : {
  //       categoryName : category
  //     },
  //     select : {
  // categoryName: true,
  //     }
  //   })
  //   let existingDepartment = await prisma.jobSubCategory.findFirst({
  //     where : {
  //       subCategoryName : subCategory
  //     },
  //     select : {
  //       subCategoryName : true
  //     }
  //   })
    // let { categoryName } = existingIndustry || {}
    // let { subCategoryName } = existingDepartment || {}
    let response = await generateJobTitles(category, subCategory , applicationType)
    
    return successResponse(res, response, "Role titles generated successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}


exports.generateRoleTitle = async (req, res)=>{
  try {
    let { category, subCategory ,applicationType} = req.body || {}
    if(!category){
      return errorResponse(res, "Category is required", 400)
    }


    let response = await generateJobTitles(category, subCategory , applicationType)
    
    return successResponse(res, response, "Role titles generated successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.generateSubCategory = async (req, res)=>{
  try {
    let { category } = req.body || {}
    if(!category){
      return errorResponse(res, "Category is required", 400)
    }

    let existingCategory = await prisma.jobCategory.findFirst({
      where : {
        id : category
      },
    })
    
        


    let response = await generateSubCategory(existingCategory.categoryName)
    
    return successResponse(res, response, "Sub category generated successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}