const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const exploreInternshipServices = require("../../services/ExploreInternship/exploreInternship.service");
const validator = require("validator");
const prisma = require("../../config/database");
exports.getExploreInternshipFilters = async (req, res) => {
  try {
    let {} = req.body || {};
    let result = await exploreInternshipServices.getExploreInternshipFilter();
    return successResponse(
      res,
      result,
      "filters fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getExploreInternshipCompanies = async (req, res) => {
  try {
    let {} = req.body || {};
    let result =
      await exploreInternshipServices.getExploreInternshipCompanies();
    return successResponse(
      res,
      result,
      "Companies fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error("ERROR ::", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternships = async (req, res) => {
  try {
    let {
      industryIds,
      departmentIds,
      locations,
      applicationType,
      internShipType,
      search = "",
      internId,
      skillIds,
      maxStipend,
      minStipend,
      stateIds,
      cityIds,
      workType,
      employmentType
    } = req.body || {};
    industryIds = Array.isArray(industryIds)
      ? industryIds
      : industryIds
      ? [industryIds]
      : [];
    departmentIds = Array.isArray(departmentIds)
      ? departmentIds
      : departmentIds
      ? [departmentIds]
      : [];
  
    internShipType =
      internShipType && typeof internShipType === "string"
        ? internShipType.split(",").map((item) => item.trim())
        : Array.isArray(internShipType)
        ? internShipType
        : [];
      
    stateIds =
      stateIds && typeof stateIds === "string"
        ? stateIds.split(",").map((item) => item.trim())
        : Array.isArray(stateIds)
        ? stateIds
        : [];

         cityIds =
      cityIds && typeof cityIds === "string"
        ? cityIds.split(",").map((item) => item.trim())
        : Array.isArray(cityIds)
        ? cityIds
        : [];
    

    if (!Array.isArray(industryIds)) {
      return errorResponse(res, "Industry ids must be an array", 400);
    }
    if (!Array.isArray(departmentIds)) {
      return errorResponse(res, "Department ids must be an array", 400);
    }
    const isValidUuidArray = (arr) => arr.every((id) => validator.isUUID(id));

    if (!isValidUuidArray(industryIds)) {
      return errorResponse(res, "Invalid industry ids", 400);
    }
    // if (!isValidUuidArray(departmentIds)) {
    //   return errorResponse(res, "Invalid department ids", 400);
    // }
   
    if (!Array.isArray(internShipType)) {
      return errorResponse(res, "Internship type must be an array", 400);
    }
    // if (!internId) {
    //   return errorResponse(res, "internId is required", 400);
    // }
    // if (!validator.isUUID(internId)) {
    //   return errorResponse(res, "Invalid Intern id", 400);
    // }

   
   if(internId) {
     let existingIntern = await prisma.interns.findFirst({
      where: {
        id: internId,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
   }
    let whereClause = {
      isDelete: false,
      jobStatus: "APPROVED",
      OR: [
    {
      jobExpireDate: {
        gte: new Date()
      }
    },
    {
      jobExpireDate: null
    }
  ]  
    };
    if (industryIds.length > 0) {
      whereClause.jobCategoryId = {
        in: industryIds,
      };
    }
    if (departmentIds.length > 0 && !departmentIds.includes("ALL")) {
      whereClause.jobSubCategoryId = {
        in: departmentIds,
      };
    }
  
  if(skillIds && skillIds.length > 0 && !skillIds.includes("ALL")){
       
      const skillsName = await  prisma.skills.findMany({
        where :{
          id : {
            in : skillIds
          }
        },
        select : {
          skillName : true
        }


      })
      const names =  skillsName.map((item) => item.skillName)

      whereClause.skills = {
        array_contains : names
      }
    }

    if(applicationType){
      whereClause.applicationType = applicationType;
    }

     if(stateIds && stateIds.length > 0 && !stateIds.includes("ALL")){
      whereClause.states   = {
       some : { id : {
          in : stateIds
        }}
      }
    }

    if(cityIds && cityIds.length > 0 && !cityIds.includes("ALL")){
      whereClause.cities = {
       some : {id : {
          in : cityIds
        }} 
      }
    }
    if (employmentType && employmentType.length > 0 && !employmentType.includes("ANY")) {
      whereClause.employmentType = {
        in : employmentType
      }
    }

     if (workType && workType.length > 0 && !workType.includes("ALL")) {
      whereClause.jobType = {
        in : workType
      }
    }
   
    if(minStipend && minStipend < maxStipend && minStipend > 0){

      if(!whereClause.AND) {
        whereClause.AND = []
      }
      whereClause.AND.push({
        minStipend : {
          gte : minStipend
        }
      })
    }

     if(maxStipend && maxStipend > minStipend && maxStipend > 0){
      if(!whereClause.AND) {
        whereClause.AND = []
      }
      whereClause.AND.push({
        maxStipend : {
          lte : maxStipend
        }
      })
    }
    
    if (internShipType.length > 0) {
      const validInternShipType = ["REMOTE", "OFFICE", "HYBRID"];

      const isValid = internShipType.every((type) =>
        validInternShipType.includes(type)
      );
      if (!isValid) {
        return errorResponse(res, "Invalid internship type", 400);
      }

      whereClause.jobType = {
        in: internShipType,
      };
    }

 
 
    let result = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        companyId: true,
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            smallLogo: true,
            city: true,
          },
        },
        appliedCandidates : true,
        experience : true,
        applicationType : true,
        jobTitle: true,
        aboutJob: true,
        skills: true,
        stipend: true,
        minStipend: true,
        maxStipend: true,
        jobType: true,
        jobCategory: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        jobSubCategory: {
          select: {
            id: true,
            subCategoryName: true,
          },
        },
        cities : true,
        states : true,
        numberOfOpenings: true,
        internshipDuration: true,
      },
    });

    if (search) {
      const lowerSearch = search.toLowerCase();

      result = result.filter((job) => {
        const titleMatch = job.jobTitle?.toLowerCase().includes(lowerSearch);
        
        let skillsArray = [];
        if (Array.isArray(job.skills)) {
          skillsArray = job.skills.map((s) =>
            typeof s === "string" ? s.toLowerCase() : ""
          );
        } else if (typeof job.skills === "string") {
          skillsArray = [job.skills.toLowerCase()];
        }

        const skillMatch = skillsArray.some((skill) =>
          skill.includes(lowerSearch)
        );
        const departmentMatch = job?.jobCategory?.categoryName.toLowerCase().includes(lowerSearch)
        const companyMatch = job.company.companyName.toLowerCase().includes(lowerSearch)
        return titleMatch || skillMatch || departmentMatch || companyMatch;
      });
    }
    let appliedJob = await prisma.candidateManagement.findMany({
      where: {
        internId: internId,
        isDelete: false,
      },
      select: {
        jobId: true,
      },
    });
    let appliedJobIds = appliedJob.map((job) => job.jobId);

    result = result.map((job) => {
      const isApplied = appliedJobIds.includes(job.id);
      return {
        ...job,
        isApplied,
      };
    });

    return successResponse(
      res,
      result,
      "Internships fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};


exports.getRandomOneInternship = async (req, res) => {

      try {
        const getTotalJobsCount = await prisma.job.count({
          where: {
            isDelete: false,
            jobStatus: "APPROVED",
            OR: [
              {
                jobExpireDate: {
                  gte: new Date()
                }
              },
              {
                jobExpireDate: null
              }
            ]
          }
        });

        const randomJobIndex = Math.floor(Math.random() * getTotalJobsCount);

        
        const randomJob = await prisma.job.findMany({
          where: {
            isDelete: false,
            jobStatus: "APPROVED",
            OR: [
              {
                jobExpireDate: {
                  gte: new Date()
                }
              },
              {
                jobExpireDate: null
              }
            ]
          },
          skip: randomJobIndex,
          take: 1,
          select: {
            id: true,
            companyId: true,
            company: {
              select: {
                id: true,
                companyName: true,
                logo: true,
                smallLogo: true,
                city: true,
              },
            },
            appliedCandidates : true,
            experience : true,
            applicationType : true,
            jobTitle: true,
            aboutJob: true,
            skills: true,
            stipend: true,
            minStipend: true,
            maxStipend: true,
            jobType: true,
            workingHours : true,
            jobCategory: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            jobSubCategory: {
              select: {
                id: true,
                subCategoryName: true,
              },
            },
            cities : true,
            states : true,
            numberOfOpenings: true,
            internshipDuration: true,
          },
        });

        return successResponse(
          res,
          randomJob[0],
          "Random internship fetched successfully",
          {},
          200
        );
      } catch (error) {
          console.error(error);
    return errorResponse(res, "Internal server error", 500);
      }
    }

exports.getInternshipDetails = async (req, res) => {
  try {
    let { internshiId, companyId, activeTab } = req.body || {};
    if (!internshiId) {
      return errorResponse(res, "Internship id is required", 400);
    }
    if (!validator.isUUID(internshiId)) {
      return errorResponse(res, "Invalid internship id", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    if (!activeTab) {
      return errorResponse(res, "active tab is required", 400);
    }
    if (activeTab) {
      let validTab = ["OVERVIEW", "JOBS", "COMPANIES"];
      if (!validTab.includes(activeTab)) {
        return errorResponse(res, "enter valid active tab", 400);
      }
    }
    let basicDetails =
      await exploreInternshipServices.getInternshipBasicDetails(
        internshiId,
        companyId
      );
    let result;
    if (activeTab === "OVERVIEW") {
      result = await exploreInternshipServices.getInternshipDetailsOverview(
        internshiId,
        companyId
      );
    } else if (activeTab === "JOBS") {
      result = await exploreInternshipServices.getInternshipDetailsJobs(
        internshiId,
        companyId
      );
    } else {
      result = await exploreInternshipServices.getInternshipDetailsCompany(
        companyId
      );
    }
    let response = {
      result,
    };
    return successResponse(res, response, "data fetched successfully", {}, 200);
  } catch (error) {
    console.error("Error ::", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.expoloreInternShipDetails = async (req, res) => {
  try {
    let { internId, jobId, companyId } = req.body || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id", 400);
    }
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    if (!validator.isUUID(jobId)) {
      return errorResponse(res, "Invalid job id", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid Company id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: internId,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
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
    let result = await prisma.job.findFirst({
      where: {
        id: jobId,
        isDelete: false,
      },
      select: {
        id: true,
        companyId: true,
        jobTitle: true,
        internshipDuration: true,
        numberOfOpenings: true,
        stipend: true,
        minStipend: true,
        maxStipend: true,
        experience: true,
        applicationType: true,  
        jobCategory: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        jobSubCategory: {
          select: {
            id: true,
            subCategoryName: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            smallLogo: true,
          },
        },
        cities : true,
        states : true
      },
    });
    let appliedJob = await prisma.candidateManagement.findMany({
      where: {
        internId: internId,
        jobId: jobId,
        companyId: companyId,
        isDelete: false,
      },
      select: {
        jobId: true,
      },
    });

    if (appliedJob && result) {
      let appliedJobIds = appliedJob.map((job) => job.jobId);

      const isApplied = appliedJobIds.includes(result.id);
      result = {
        ...result,
        isApplied,
      };
    } else {
      result = {
        ...result,
        isApplied: false,
      };
    }

    return successResponse(
      res,
      result,
      "Job Details fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.exploreInternshipJobInfoByStatus = async (req, res) => {

  try {
    let { internId, jobId, companyId, activeTab , applicationType} = req.body || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id", 400);
    }
    if (!jobId) {
      return errorResponse(res, "Job id is required", 400);
    }
    if (!validator.isUUID(jobId)) {
      return errorResponse(res, "Invalid job id", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid Company id", 400);
    }
    if (!activeTab) {
      return errorResponse(res, "active tab is required", 400);
    }
    let validTab = ["OVERVIEW", "JOBS", "COMPANIES"];
    if (!validTab.includes(activeTab)) {
      return errorResponse(res, "Invalid active tab", 400);
    }

    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: internId,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
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
    let result;
    switch (activeTab) {
      case "OVERVIEW":
        result = await prisma.job.findFirst({
          where: {
            id: jobId,
            companyId: companyId,
          },
          select: {
            id : true,
            internshipDuration: true,
            workingHours: true,
            skills: true,
            aboutJob: true,
            otherRequirements: true,
            additionalBenefits: true,
            appliedCandidates: true,
            jobCategory: true,
            createdAt: true,
            jobActiveDate: true,
            jobExpireDate: true,
            jobType: true,
            company: {
               select: {
                city: true,
                state: true,
                country: true,
              },
            },
          },
        });
        break;
      case "JOBS":
        result = await prisma.job.findMany({
          where: {
            companyId: companyId,
            jobStatus: "APPROVED",
            isDelete: false,
            applicationType: applicationType,
          },
          select: {
            id : true,
            jobTitle: true,
            workingHours: true,
            internshipDuration: true,
            skills: true,
            aboutJob: true,
            jobType: true,  
            company: {
              select: {
                smallLogo: true,
                id: true,
                companyName: true,
              },
            },
            numberOfOpenings: true,
            jobCategory: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            jobSubCategory: {
              select: {
                id: true,
                subCategoryName: true,
              },
            },
            stipend: true,
            minStipend: true,
            maxStipend: true,
          },
        });
        break;
      case "COMPANIES":
        result = await prisma.company.findFirst({
          where: {
            id: companyId,
          },
          select: {
            id: true,
            companyName: true,
            email: true,
            companyIndustry: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            companySize: true,
            companyIntro: true,
            foundedYear: true,
            country: true,
            state: true,
            city: true,
            address: true,
            branchLocation: true,
            linkdinUrl: true,
            instagramUrl: true,
            youtubeUrl: true,
            websiteUrl: true,
          },
        });
        break;
    }
    let appliedJob = await prisma.candidateManagement.findMany({
      where: {
        internId: internId,
        jobId: jobId,
        companyId: companyId,
        isDelete: false,
      },
      select: {
        jobId: true,
      },
    });
    let appliedJobIds = appliedJob.map((job) => job.jobId);

    // ✅ Add `isApplied` flag
    if (Array.isArray(result)) {
      result = result.map((job) => ({
        ...job,
        isApplied: appliedJobIds.includes(job.id),
      }));
    } else if (result) {
      result.isApplied = appliedJobIds.includes(result.id);
    }
   
    return successResponse(
      res,
      result,
      "Job Details fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
