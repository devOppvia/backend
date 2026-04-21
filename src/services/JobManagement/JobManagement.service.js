const prisma = require("../../config/database");
const { getPagination, getPagingData } = require("../../utils/getPagination");
const { generateJobAboutAI } = require("../../helpers/openAi");

exports.fetcheJobBasedOnId = async (jobId) => {
  return await prisma.job.findUnique({
    where: {
      id: jobId,
      isDelete: false,
    },
  });
};

exports.getJobBasedOnId = async (jobId) => {
  return await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });
};

exports.submitJobOpening = async (data) => {
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
    jobStatus,
    minStipend,
    maxStipend,
    subscriptionId,
    applicationType,
    experience,
    city,
    state,
    aiCall
  } = data || {};
  minStipend = parseInt(minStipend);
  maxStipend = parseInt(maxStipend);
  let currentPackage = await prisma.companySubscription.findFirst({
    where : {
      subscriptionId : subscriptionId,
      isActive : true
    },
    select : {
      id : true,
      subscriptionId : true,
      jobDaysActive : true,
      resumeAccessCredits : true
    },
    orderBy : {
      createdAt : "desc"
    }
  })
  console.log("current sub ==> " , currentPackage)
  let jobDaysActive = currentPackage.jobDaysActive
  let resumeAccessCredits = currentPackage.resumeAccessCredits
  
  if(currentPackage){
   
    await prisma.companySubscription.update({
      where : {
        id : currentPackage.id
      },
      data : {
        jobPostingCredits : {
          decrement : 1
        }
      }
    })
  }


  const getState = await prisma.state.findFirst({
    where : {
      name : state
    }
  }) 
  const getCity = await prisma.city.findFirst({
    where : {
      name : city,
      stateId : getState.iso2
    }
  }) 

  console.log("creating job... ==> " , aiCall)

  const job = await prisma.job.create({
    data: {
      companyId: companyId,
      jobTitle: jobTitle,
      jobCategoryId: jobCategoryId,
      jobSubCategoryId: jobSubCategoryId,
      internshipDuration: internshipDuration,
      workingHours: workingHours,
      skills: skills,
      aboutJob: aboutJob,
      otherRequirements: otherRequirements,
      numberOfOpenings: numberOfOpenings,
      // location: location,
      stipend: stipend,
      additionalBenefits: additionalBenefits,
      jobType: jobType,
      jobStatus: jobStatus ? jobStatus : "REVIEW",
      minStipend: minStipend,
      maxStipend: maxStipend,
      subscriptionId : subscriptionId,
      applicationType : applicationType,
      jobDaysActive : jobDaysActive,
      resumeAccessCredits : resumeAccessCredits,
      experience : applicationType === "JOB" ? experience : null,
      callEnable : aiCall.enabled,
      callConditionScore : aiCall.callMode === "SCORE" ? aiCall.minScore : 0,
      cities: {
       connect: { id: getCity.id }
      },
      states: {
       connect: { id: getState.id }
      }
    },
  });

  console.log("job created ========> " , job.id)





  await prisma.job.update({
    where: {
      id: job.id,
    },
    data: {
      aiCallQuestions: {
        createMany: {
          data: aiCall.questions.map((question, index) => {
          return {
            question: question,
            order: index + 1,
            isActive: true,
            companyId: companyId,
          };
        }),
      },
    },
  }});
  return job
};

exports.getJobsBasedOnStatus = async (
  jobStatus,
  companyId,
  jobCategoryId,
  jobSubCategoryId,
  startDate,
  endDate,
  itemsPerPage,
  currentPage,
  search
) => {
  let whereClause = {
    isDelete: false,
    companyId: companyId,
  };
  if (jobStatus) {
    whereClause.jobStatus = jobStatus;
  }
  if (jobCategoryId) {
    whereClause.jobCategoryId = jobCategoryId;
  }
  if (jobSubCategoryId) {
    whereClause.jobSubCategoryId = jobSubCategoryId;
  }
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }
  if(search){
    whereClause.jobTitle = {
      contains : search
    }
  }
  console.log("whereClause ==> " , whereClause)

  const { skip, take } = getPagination(currentPage, itemsPerPage);

  const jobs = await prisma.job.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      companyId: true,
      jobTitle: true,
      jobCategoryId: true,
      minStipend: true,
      maxStipend: true,
      subscriptionId : true,
      jobCategory: {
        select: {
          categoryName: true,
        },
      },
      jobSubCategoryId: true,
      jobSubCategory: {
        select: {
          subCategoryName: true,
        },
      },
      internshipDuration: true,
      workingHours: true,
      skills: true,
      aboutJob: true,
      otherRequirements: true,
      numberOfOpenings: true,
      stipend: true,
      additionalBenefits: true,
      jobType: true,
      createdAt: true,
      jobStatus: true,
      applicationType : true,
      appliedCandidates : true,
      minStipend : true,
      maxStipend : true,
      employmentType : true
    },
    skip,
    take,
  });
  const totalJobs = await prisma.job.count({
    where: whereClause,
  });

  return {
    pagination: getPagingData(totalJobs, currentPage, itemsPerPage),
    jobs,
  };
};

exports.getJobsBasedOnStatusForAdmin = async (
  jobStatus,
  currentPage,
  itemsPerPage
) => {
  let whereClause = {
    isDelete: false,
    NOT: {
      jobStatus: "DRAFT",
    },
  };
  if (jobStatus) {
    whereClause.jobStatus = jobStatus;
  }
  const { skip, take } = getPagination(currentPage, itemsPerPage);
  let totalJobs = await prisma.job.count({
    where: whereClause,
  });
  let jobs = await prisma.job.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      companyId: true,
      jobTitle: true,
      jobCategoryId: true,
      score: true,
      jobCategory: {
        select: {
          categoryName: true,
        },
      },
      jobSubCategoryId: true,
      jobSubCategory: {
        select: {
          subCategoryName: true,
        },
      },
      company: {
        select: {
          companyName: true,
        },
      },
      internshipDuration: true,
      workingHours: true,
      skills: true,
      aboutJob: true,
      otherRequirements: true,
      numberOfOpenings: true,
      stipend: true,
      additionalBenefits: true,
      jobType: true,
      createdAt: true,
      jobStatus: true,
    },
    skip,
    take,
  });
  return { jobs, totalJobs };
};

exports.getJobDetails = async (jobId) => {
  return await prisma.job.findUnique({
    where: {
      id: jobId,
      isDelete: false,
    },
    select: {
      id: true,
      companyId: true,
      jobTitle: true,
      jobCategoryId: true,
      jobSubCategoryId: true,
      internshipDuration: true,
      workingHours: true,
      skills: true,
      aboutJob: true,
      otherRequirements: true,
      numberOfOpenings: true,
      // location: true,
      stipend: true,
      additionalBenefits: true,
      jobType: true,
      jobStatus: true,
      createdAt: true,
      minStipend: true,
      maxStipend: true,
      jobCategory: {
        select: {
          categoryName: true,
        },
      },
      jobSubCategory: {
        select: {
          subCategoryName: true,
        },
      },
    },
  });
};

exports.deleteJobDetailsByCompany = async (jobId) => {
  return await prisma.job.update({
    where: {
      id: jobId,
    },
    data: {
      isDelete: true,
    },
  });
};

exports.updateJobStatus = async (
  jobId,
  jobStatus,
  reason,
  jobActiveDate,
  jobExpireDate,
  jobDaysActive,
  subscriptionPlanId
) => {
  let jobData = {
    jobStatus: jobStatus,
    rejectReason: reason,
    jobActiveDate: jobActiveDate,
    jobExpireDate: jobExpireDate,
    jobDaysActive : jobDaysActive
  }
    if(subscriptionPlanId){
      jobData.subscriptionId = subscriptionPlanId
    }
  return await prisma.job.update({
    where: {
      id: jobId,
    },
    data: jobData,
  });
};

exports.updateJobDetails = async (jobId, data) => {
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
  } = data || {};
  return await prisma.job.update({
    where: {
      id: jobId,
    },
    data: {
      companyId: companyId,
      jobTitle: jobTitle,
      jobCategoryId: jobCategoryId,
      jobSubCategoryId: jobSubCategoryId,
      internshipDuration: internshipDuration,
      workingHours: workingHours,
      skills: skills,
      aboutJob: aboutJob,
      otherRequirements: otherRequirements,
      numberOfOpenings: numberOfOpenings,
      location: location,
      stipend: stipend,
      additionalBenefits: additionalBenefits,
      jobType: jobType,
      jobStatus: "REVIEW",
      minStipend : minStipend,
      maxStipend : maxStipend
    },
  });
};

exports.getCompanyLocations = async (companyId) => {
  return await prisma.company.findFirst({
    where: {
      id: companyId,
    },
    select: {
      address: true,
      branchLocation: true,
    },
  });
};

exports.generateJobAbout = async (prompt) => {
  try {
    return (response = generateJobAboutAI(prompt));
  } catch (error) {
    console.error(error);
    return;
  }
};

exports.updateJobBulkStatus = async (status, jobIds) => {
  return await prisma.job.updateMany({
    where: {
      id: {
        in: jobIds,
      },
    },
    data: {
      jobStatus: status,
    },
  });
};
