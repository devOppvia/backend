const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const validator = require("validator");
exports.scheduleInterview = async (req, res) => {
  try {
    let {
      id,
      companyId,
      jobId,
      internId,
      interviewType,
      interviewDate,
      interviewTime,
      interviewLink,
      interviewLocation,
    } = req.body || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!interviewType) {
      return errorResponse(res, "Interview type is required", 400);
    }
    if (!["ONLINE", "OFFLINE"].includes(interviewType)) {
      return errorResponse(res, "Interview type is invalid", 400);
    }
    if (!interviewDate) {
      return errorResponse(res, "Interview date is required", 400);
    }
    if (!interviewTime) {
      return errorResponse(res, "Interview time is required", 400);
    }
    if (interviewType === "ONLINE") {
      if (!interviewLink) {
        return errorResponse(res, "Interview link is required", 400);
      }
    }
    if (interviewType === "OFFLINE") {
      if (!interviewLocation) {
        return errorResponse(res, "Interview location is required", 400);
      }
    }
    let existingCandidate = await prisma.candidateManagement.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingCandidate) {
      return errorResponse(res, "Candidate not found", 400);
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
      },
    });
    if (!existingJob) {
      return errorResponse(res, "Job not found", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: internId,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let existingInterview = await prisma.interview.findFirst({
      where: {
        companyId: companyId,
        jobId: jobId,
        internId: internId,
      },
    });
    if (existingInterview) {
      return errorResponse(res, "Interview already scheduled", 400);
    }

    console.log("existingInterview", existingInterview);
    await prisma.candidateManagement.update({
      where: {
        id: id,
      },
      data: {
        candidateStatus: "INTERVIEW",
      },
    });
    // console.log("payload is. : " , {
    //     companyId: companyId,
    //     jobId: jobId,
    //     internId: internId,
    //     interviewType: interviewType,
    //     interviewDate: interviewDate,
    //     interviewTime: interviewTime,
    //     interviewLink: interviewLink,
    //     interviewLocation: interviewLocation,
    //     candidateManagementId : id
    //   },
    // )
    const interview = await prisma.interview.create({
  data: {
    companyId,
    jobId,
    internId,
    interviewType,
    interviewDate,
    interviewTime,
    interviewLink,
    interviewLocation,
    candidateManagementId: id
  },
});

console.log("Interview created:", interview);
    return successResponse(
      res,
      {},
      "Interview scheduled successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getScheduledInterviewIntern = async (req, res) => {
  try {
    let { internId } = req.params || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Intern id is invalid", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: internId,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let scheduledInterview = await prisma.interview.findMany({
      where: {
        internId: internId,
        
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        companyId: true,
        jobId: true,
        internId: true,
        interviewType: true,
        interviewDate: true,
        interviewTime: true,
        interviewLink: true,
        interviewLocation: true,
        interviewStatus: true,
        createdAt: true,
        rejectReason : true,
        job : {
            select : {
                jobStatus : true,
                jobTitle : true,
                aboutJob : true,
                jobCategory : {
                    select : {
                        categoryName : true
                    }
                },
                jobSubCategory : {
                    select : {
                        subCategoryName : true
                    }
                },
                jobType : true,
                skills : true,
                stipend : true,
                minStipend : true,
                maxStipend : true
            }
        },
        company : {
            select : {
                companyName : true,
                smallLogo : true ,
                hrAndRecruiterName : true,
                phoneNumber : true,
                websiteUrl : true,
            }
        },
        intern : {
          select : {
            isOpenToWork : true
          }
        }
      },
    });

    return successResponse(
      res,
      scheduledInterview,
      "Intern scheduled interviews fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.joinInterview = async (req, res)=>{
    try {
        let { id } = req.params || {}
        let { interviewStatus, rejectReason } = req.body || {}
        if(!id){
            return errorResponse(res, "Interview id is required", 400)
        }
        if(!validator.isUUID(id)){
            return errorResponse(res, "Interview id is invalid", 400)
        }
        if(!interviewStatus){
            return errorResponse(res, "Interview status is required", 400)
        }
        if(!["YES","NO","MAYBE"].includes(interviewStatus)){
            return errorResponse(res, "Interview status is invalid", 400)
        }
        if(interviewStatus === "NO" && !rejectReason){
            return errorResponse(res, "Reject reason is required", 400)
        }
        let existingInterview = await prisma.interview.findFirst({
            where : {
                id : id
            }
        })
        if(!existingInterview){
            return errorResponse(res, "Interview not found", 400)
        }
        if(existingInterview.isAcceptedInterview){
            return errorResponse(res, "Interview already accepted", 400)
        }
        await prisma.interview.update({
            where : {
                id : id
            },
            data : {
                interviewStatus : interviewStatus,
                rejectReason : rejectReason
            }
        })
        return successResponse(
            res,
            {},
            "Interview status updated successfully",
            {},
            200
        )
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}
