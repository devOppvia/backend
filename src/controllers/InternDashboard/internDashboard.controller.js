const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
let validator = require("validator");
exports.getInternDashboardDetails = async (req, res) => {
  try {
    let { internId } = req.params || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: internId,
        isDelete: false,
        internStatus: "APPROVED",
        isProfileComplate: true,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let [totalApplication,activeReviews , Shortlisted, Interview , Hired] =
      await Promise.all([
        prisma.candidateManagement.count({
          where: {
            isDelete: false,
            internId: internId,
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              lte: new Date(),
            },
          },
        }),
        
        prisma.candidateManagement.count({
          where: {
            isDelete: false,
            candidateStatus: "REVIEW",
            internId: internId,
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              lte: new Date(),
            },
          },
        }),
        prisma.candidateManagement.count({
          where: {
            isDelete: false,
            candidateStatus: "SHORTLISTED",
            internId: internId,
          },
        }),
       
        prisma.candidateManagement.count({
          where: {
            isDelete: false,
            candidateStatus: "INTERVIEW",
            internId: internId,
          },
        }),

        prisma.candidateManagement.count({
          where: {
            isDelete: false,
            candidateStatus: "HIRED",
            internId: internId,
          },
        }),
       
      ]);
    let response = [
       {
        label: "Total Applications",
        value: totalApplication,
        icon: "📄",
      },
      {
        label: "Shortlisted",
        value: Shortlisted,
        icon: "✅",
      },
       {
        label: "Active Reviews",
        value: activeReviews,
        icon: "📄",
      },
      {
        label: "Interview",
        value: Interview,
        icon: "🎤",
      }, 
      {
        label: "Hired",
        value: Hired,
        icon: "🎉",
      }, 
    ];

    return successResponse(
      res,
      response,
      "Intern details fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};


exports.getRecommendedOpportunities = async (req, res) => {
  try {
       
    let { InternId } = req.params || {};
    
    if (!InternId) {
      return errorResponse(res, "Intern id is required", 400);
    }

    if (!validator.isUUID(InternId)) {
      return errorResponse(res, "Invalid intern id", 400);
    }

    const existingIntern = await prisma.interns.findFirst({
      where: {
        id: InternId,
        isDelete: false,
        internStatus: "APPROVED",
        isProfileComplate: true,
      },
      select: {
        preferredLocation: true,
        preferredStates : true,
        industry: true,
        department: true,
        skills: true,
        applicationType: true,
        interview: true,
      },
    });

    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }


    const preferredLocationIds = existingIntern.preferredLocation.map(
      (i) => i.id
    );

    const preferredSatesIds = existingIntern.preferredStates.map((
      i
    ) => i.id)

    const getSkills = await prisma.skills.findMany({
      where : {
        id : {
          in : existingIntern.skills.map((i) => i.id)
        }
      },
      select : {
        skillName : true
      }
    })

    const Locations = await prisma.city.findMany({
      where : {
        id : {
          in : preferredLocationIds
        }
      },
      select : {
        name : true
      }
    })

    const States = await prisma.state.findMany({
      where : {
        id : {
          in : preferredSatesIds
        }
      }
    })
   

    const industryIds = existingIntern.industry || [];
    const departmentIds = existingIntern.department || [];
    const skillIds = getSkills.map((item) => item.skillName) || [];
    const appliedJobIds = existingIntern.interview.map((i) => i.jobId);
    const preferredLocations = Locations.map((item) => item.name)
    const preferredStates = States.map((item) => item.name)


const recommendedJobs = await prisma.job.findMany({
  where: {
    jobCategoryId: { in: industryIds },

    jobSubCategoryId: { in: departmentIds },

    applicationType: existingIntern.applicationType,

    OR : {
      states: {
      in: preferredLocations
    },
cities : {
      in: preferredStates
    },
     
    },

    NOT: {
      id: { in: appliedJobIds }
    },

    OR: skillIds.map(skill => ({
      skills: {
        array_contains: skill
      }
    }))
  },
  
  include: {
    company: {
      select: {
        companyName: true,
        smallLogo: true
      }
    }
  },

  take: 10
});


    return successResponse(
      res,
      recommendedJobs,
      "Recommended jobs fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};