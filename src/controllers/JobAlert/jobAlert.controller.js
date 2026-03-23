const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const jobAlertServices = require("../../services/JobAlert/jobAlert.service");
const validator = require("validator");
const internManagement = require("../../services/InternManagement/internManagement.service");
const prisma = require("../../config/database");
const {
  sendWebPushNotification,
} = require("../../helpers/WebPushNotification/notificationHelper");
const {
  sendInternWithdrawMailToCompany,
  sendInternJoinMailToCompany,
} = require("../../helpers/sendMail");

exports.getInternJobAlert = async (req, res) => {
  try {
    let {
      internId,
      jobStatus,
      itemsPerPage = 1,
      currentPage = 1,
    } = req.body || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id", 400);
    }
    if (jobStatus) {
      let validStatus = [
        "SHORTLISTED",
        "REVIEW",
        "INTERVIEW",
        "HIRED",
        "REJECTED",
      ];
      if (!validStatus.includes(jobStatus)) {
        return errorResponse(res, "Invalid job status", 400);
      }
    }
    let existingAppliedJobs = await jobAlertServices.getJobAlertInternPanel(
      internId,
      jobStatus,
      itemsPerPage,
      currentPage
    );
    
    for(let job of existingAppliedJobs.appliedJobs){
      let { internId } = job || {}
      if(internId){
        let existingIntern = await prisma.interns.findUnique({
          where : {
            id : internId
          }
        })
        job.isOpenToWork = existingIntern.isOpenToWork
      }
    }
    return successResponse(
      res,
      existingAppliedJobs,
      "Jobs fetched successfully",
      existingAppliedJobs.pagination,
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteInternProfile = async (req, res) => {
  try {
    let { internId } = req.params || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id", 400);
    }
    let existingIntern = await internManagement.getInternBasedOnId(internId);
    if (!existingIntern) {
      return errorResponse(res, "Intern not exist", 400);
    }
    await jobAlertServices.deleteInternAccount(internId);
    return successResponse(res, {}, "Profile deleted successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteAppliedJobAlert = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id format", 400);
    }
    let existingAppliedJob = await prisma.candidateManagement.findUnique({
      where: {
        id: id,
      },
      select: {
        company: {
          select: {
            email: true,
            fcmToken: true,
            companyName: true,
          },
        },
        intern: {
          select: {
            fullName: true,
          },
        },
        job: {
          select: {
            jobTitle: true,
          },
        },
      },
    });
    if (existingAppliedJob) {
      let { email, fcmToken, companyName } = existingAppliedJob.company;
      let { fullName } = existingAppliedJob.intern;
      let { jobTitle } = existingAppliedJob.job;
      let message = `Your job application has been deleted by the intern`;
      let title = "Job Deleted";
      if (fcmToken) {
        await sendWebPushNotification(fcmToken, title, message);
      }
      if (email) {
        let data = {
          email: email,
          companyName: companyName,
          internName: fullName,
          jobTitle: jobTitle,
        };
        await sendInternWithdrawMailToCompany(data);
      }
    }
    await prisma.candidateManagement.delete({
      where: {
        id: id,
      },
    });
    return successResponse(res, {}, "Job deleted successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.acceptTheOfferAndJoinCompany = async (req, res) => {
  try {
    let { id } = req.params || {};
    
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id format", 400);
    }
    let existingAppliedJob = await prisma.candidateManagement.findUnique({
      where: {
        id: id,
        candidateStatus: "HIRED",
      },
      select: {
        internId : true,
        company: {
          select: {
            email: true,
            fcmToken: true,
            companyName: true,
          },
        },
        job: {
          select: {
            jobTitle: true,
          },
        },
        intern: {
          select: {
            fullName: true,
          },
        },
      },
    });
    if (!existingAppliedJob) {
      return errorResponse(res, "Job not exist", 400);
    }
    if(existingAppliedJob){
      await prisma.candidateManagement.update({
        where : {
          id : id
        },
        data : {
          isJoined : true
        }
      })
    }
    let { internId } = existingAppliedJob || {};
    if (internId) {
      await prisma.interns.update({
        where: {
          id: internId,
        },
        data: {
          isOpenToWork: false,
        },
      });
    }
    let otherJobs = await prisma.candidateManagement.findMany({
      where : {
        internId : internId,
        NOT : {
          id : id
        }
      }
    })
    for(let job of otherJobs){
      await prisma.candidateManagement.update({
        where : {
          id : job.id
        },
        data : {
          candidateStatus : "REJECTED"
        }
      })
    }
    
    let { email, companyName, fcmToken } = existingAppliedJob.company || {};
    let { jobTitle } = existingAppliedJob.job || {};
    let { fullName } = existingAppliedJob.intern || {};
    if (fcmToken) {
      let title = "Job Accepted";
      let message = `Your job application has been accepted by the ${fullName}`;
      await sendWebPushNotification(fcmToken, title, message);
    }
    let body = {
      email: email,
      companyName: companyName,
      internName: fullName,
      jobTitle,
    };
    await sendInternJoinMailToCompany(body);
    return successResponse(res, {}, "Job accepted successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
