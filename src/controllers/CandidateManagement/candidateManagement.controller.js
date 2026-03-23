const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const candidateManagementService = require("../../services/CandidateManagement/candidateManagement.service");
const companyManagementService = require("../../services/CompanyManagement/CompanyManagement.service");
const jobManagementService = require("../../services/JobManagement/JobManagement.service");
const validatory = require("validator");
const path = require("path");
const fs = require("fs");
const prisma = require("../../config/database");
const {
  sendWebPushNotification,
} = require("../../helpers/WebPushNotification/notificationHelper");
const getAvatarPath = require("../../helpers/static_avatar_path");
exports.applyJob = async (req, res) => {
  try {
    let { internId, jobId, companyId } = req.body || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validatory.isUUID(internId)) {
      return errorResponse(res, "Intern id is not valid", 400);
    }
    if (!validatory.isUUID(jobId)) {
      return errorResponse(res, "Job id is not valid", 400);
    }
    if (!validatory.isUUID(companyId)) {
      return errorResponse(res, "Company id is not valid", 400);
    }
    let existingCompany =
      await companyManagementService.getCompanyDetailsBasedOnCompanyId(
        companyId
      );
    if (!existingCompany) {
      return errorResponse(res, "Company does not exist", 404);
    }
    let existingJob = await jobManagementService.fetcheJobBasedOnId(jobId);
    if (!existingJob) {
      return errorResponse(res, "Job does not exist", 404);
    }
    let existingIntern =
      await candidateManagementService.fetchCandidateBasedOnId(internId);
    if (!existingIntern) {
      return errorResponse(res, "Intern does not exist", 404);
    }
    let { subscriptionId } = existingJob || {};
    if (subscriptionId) {
      let currentPlan = await prisma.companySubscription.findFirst({
        where: {
          subscriptionId: subscriptionId,
          companyId: companyId,
          isActive: true,
        },
      });
      if (currentPlan) {
        
        await prisma.companySubscription.update({
          where: {
            id: currentPlan.id,
          },
          data: {
            resumeAccessCredits: {
              decrement: 1,
            },
          },
        });
      }
    }
    //  else {
      let existingJobs = await prisma.job.findFirst({
        where: {
          id: jobId,
        },
      });
      if (existingJobs) {
        existingJobs = await prisma.job.update({
          where: {
            id: jobId,
          },
          data: {
            appliedCandidates: {
              increment: 1,
            },
          },
        });
      }
      if (existingJobs.resumeAccessCredits === existingJobs.appliedCandidates) {
        await prisma.job.update({
          where: {
            id: jobId,
          },
          data: {
            jobStatus: "COMPLETED",
          },
        });
      }
    // }

    await candidateManagementService.applyJob(internId, jobId, companyId);
    return successResponse(res, {}, "Job applied successfulluy", {}, 201);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAppliedCandidatesForCompany = async (req, res) => {
  try {
    let {
      companyId,
      status,
      startDate,
      endDate,
      jobCategoryId,
      jobSubCategoryId,
      search
    } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validatory.isUUID(companyId)) {
      return errorResponse(res, "Company id is not valid", 400);
    }
    if (status) {
      let validStatus = [
        "SHORTLISTED",
        "REVIEW",
        "INTERVIEW",
        "HIRED",
        "REJECTED",
      ];
      if (!validStatus.includes(status)) {
        return errorResponse(res, "Status is not valid", 400);
      }
    }
    if (jobCategoryId) {
      if (!validatory.isUUID(jobCategoryId)) {
        return errorResponse(res, "Job category id is not valid", 400);
      }
    }
    if (jobSubCategoryId) {
      if (!validatory.isUUID(jobSubCategoryId)) {
        return errorResponse(res, "Job sub category id is not valid", 400);
      }
    }
    let existingCompany =
      await companyManagementService.getCompanyDetailsBasedOnCompanyId(
        companyId
      );
    if (!existingCompany) {
      return errorResponse(res, "Company does not exist", 404);
    }
    let appliedCandidates =
      await candidateManagementService.getAppliedCandidatesForCompany(
        companyId,
        status,
        jobCategoryId,
        jobSubCategoryId,
        startDate,
        endDate,
        search
      );
     for(let candidate of appliedCandidates){
      let { profilePicture, gender } = candidate.intern || {}
      if(!profilePicture){
        let profilePicture = await getAvatarPath(gender)
        candidate.intern.profilePicture = profilePicture
      }
     }
    return successResponse(
      res,
      appliedCandidates,
      "Applied candidates fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateCandidateStatus = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { status } = req.body || {};

    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validatory.isUUID(id)) {
      return errorResponse(res, "Id is not valid", 400);
    }
    if (!status) {
      return errorResponse(res, "Status is required", 400);
    }
    if (status) {
      let validStatus = ["SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"];
      if (!validStatus.includes(status)) {
        return errorResponse(res, "Status is not valid", 400);
      }
    }
    let existingCandidate =
      await candidateManagementService.fetchAppliedJobById(id);
    if (!existingCandidate) {
      return errorResponse(res, "Candidate does not exist", 404);
    }
    
    let { internId, jobId, companyId } = existingCandidate || {};
    let internData = await prisma.interns.findFirst({
      where: {
        id: internId,
      },
    });
    let { fcmToken } = internData || {};
    if (fcmToken) {
      let title = "Job Status Updated";
      let body = `Your job application has been changed to ${status}`;
      await prisma.internNotification.create({
        data: {
          internId: internId,
          title: title,
          message: body,
        },
      });
      try {
        await sendWebPushNotification(fcmToken, title, body);
      } catch (error) {
        if (
          error.code === "messaging/invalid-argument" ||
          error.errorInfo?.code === "messaging/invalid-argument"
        ) {
          console.warn("⚠️ Invalid FCM token — skipping notification");
        } else {
          console.error("❌ Unexpected FCM error:", error);
        }
      }
    }
    await candidateManagementService.updateCandidateStatus(id, status);
    await prisma.interview.deleteMany({
      where : {
        companyId : companyId,
        internId : internId,
        jobId : jobId
      }
    })
    return successResponse(
      res,
      {},
      "Candidate status updated successfully",
      200
    );
  } catch (error) {
    console.error(error);
    
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteAppliedCandidate = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validatory.isUUID(id)) {
      return errorResponse(res, "Id is not valid", 400);
    }
    let existingCandidate =
      await candidateManagementService.fetchAppliedJobById(id);
    if (!existingCandidate) {
      return errorResponse(res, "Candidate does not exist", 404);
    }
    await candidateManagementService.deleteCandidate(id);
    await prisma.interview.deleteMany({
      where : {
        candidateManagementId : id
      }
    })
    return successResponse(res, {}, "Candidate deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCandidateDetailsBasedOnId = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }

    if (!validatory.isUUID(id)) {
      return errorResponse(res, "Id is not valid", 400);
    }
    let existingCandidate =
      await candidateManagementService.getCandidateDetailsBasedOnIds(id);

    if (!existingCandidate) {
      return errorResponse(res, "Candidate does not exist", 404);
    }

    let existingCandidateDetails =
      await candidateManagementService.getCandidateDetailsForCompanyViewDetails(
        id
      );
      let { profilePicture, gender } = existingCandidateDetails || {}
      if(!profilePicture){
        let profile_Picture = await getAvatarPath(gender)
        existingCandidateDetails.profilePicture = profile_Picture
      }
    return successResponse(
      res,
      existingCandidateDetails,
      "Candidate details fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.downloadResume = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validatory.isUUID(id)) {
      return errorResponse(res, "Id is not valid", 400);
    }

    let existingCandidate =
      await candidateManagementService.getCandidateBasedOnId(id);
    if (!existingCandidate) {
      return errorResponse(res, "Candidate does not exist", 404);
    }
    let candidateResumePath = await candidateManagementService.downloadResume(
      id
    );
    let { resume, fullName } = existingCandidate || {};
    let fullPath = path.join(__dirname, "../../../uploads", resume);
    if (!fs.existsSync(fullPath)) {
      return errorResponse(res, "Resume does not exist", 404);
    }
    let fileExtension = path.extname(resume);
    let safeName = fullName.replace(/\s+/g, "-");
    let downloadName = `${safeName}-Resume${fileExtension}`;
    return res.download(fullPath, downloadName, (err) => {
      if (err) {
        return errorResponse(res, "Error downloading resume", 400);
      }
    });
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};
