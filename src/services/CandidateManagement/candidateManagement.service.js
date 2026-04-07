const prisma = require("../../config/database");

exports.fetchCandidateBasedOnId = async (candidateId) => {
  return await prisma.interns.findFirst({
    where: {
      isDelete: false,
      id: candidateId,
    },
   
  });
};

exports.fetchInternResumeBasedOnId = async (internId) => {
  return await prisma.interns.findFirst({
    where: {
      id: internId,
      isDelete: false,
    },
    select: {
      resume: true,
      fullName: true,
    },
  });
};

exports.fetchAppliedJobById = async (id) => {
  return await prisma.candidateManagement.findFirst({
    where: {
      isDelete: false,
      id: id,
    },
  });
};

exports.applyJob = async (internId, jobId, companyId) => {
  return await prisma.candidateManagement.create({
    data: {
      internId: internId,
      jobId: jobId,
      companyId: companyId,
      candidateStatus: "REVIEW",
    },
  });
};

exports.getAppliedCandidatesForCompany = async (
  companyId,
  status,
  jobCategoryId,
  jobSubCategoryId,
  startDate,
  endDate,
  search
) => {
  let whereClause = {
    isDelete: false,
    companyId: companyId,
  };
  if (status) {
    whereClause.candidateStatus = status;
  }
  if (jobCategoryId) {
    whereClause.job = {
      ...whereClause.job,
      jobCategoryId: jobCategoryId,
    };
  }

  if (jobSubCategoryId) {
    whereClause.job = {
      ...whereClause.job,
      jobSubCategoryId: jobSubCategoryId,
    };
  }
  if (startDate && endDate) {
    // whereClause.createdAt = {
    //   gte: new Date(startDate),
    //   lte: new Date(endDate),
    // };
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    whereClause.createdAt = {
      gte: start,
      lte: end,
    };
  }

  if(search){
    whereClause.intern = {
      ...whereClause.intern,
      fullName: {
        contains: search,
      },
    };
  }

  return await prisma.candidateManagement.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      internId: true,
      intern: {
        select: {
          profilePicture: true,
          email : true,
          fullName: true,
          skills: true,
          gender : true,
          // city: true,
          isOpenToWork: true,
          highestQualification : true,
          degreeOrCourse : true,
          experience : true,
          mobileNumber : true,
          resume : true
        },
      },
      jobId: true,
      job: {
        select: {
          jobTitle: true,
          aboutJob: true,
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
        },
      },
      interview: {
        select: {
          interviewDate: true,
          interviewLink: true,
          interviewLocation: true,
          interviewStatus : true,
          rejectReason : true,
          interviewTime: true,
          interviewType: true,
        },
      },
      companyId: true,
      candidateStatus: true,
      createdAt: true,
    },
  });
};

exports.updateCandidateStatus = async (candidateId, status) => {
  return await prisma.candidateManagement.update({
    where: {
      id: candidateId,
    },
    data: {
      candidateStatus: status,
    },
  });
};

exports.deleteCandidate = async (id) => {
  return await prisma.candidateManagement.update({
    where: {
      id: id,
    },
    data: {
      isDelete: true,
    },
  });
};

exports.getCandidateDetailsBasedOnId = async (id) => {
  return await prisma.candidateManagement.findFirst({
    where: {
      id: id,
      isDelete: false,
    },
  });
};

exports.getCandidateBasedOnId = async (id) => {
  return await prisma.interns.findFirst({
    where: {
      id: id,
      isDelete: false,
    },
  });
};

exports.getCandidateDetailsBasedOnIds = async (id) => {
  return await prisma.interns.findFirst({
    where: {
      id: id,
    },
  });
};

exports.getCandidateDetailsForCompany = async (id) => {
  return await prisma.candidateManagement.findUnique({
    where: {
      id: id,
      isDelete: false,
    },
    select: {
      intern: {
        select: {
          profilePicture: true,
          city: true,
          state: true,
          country: true,
          email: true,
          gender: true,
          countryCode: true,
          mobileNumber: true,
          DOB: true,
          highestQualification: true,
          collageOrUniversityName: true,
          degreeOrCourse: true,
          yosOrGraduationYear: true,
          cgpaOrPercentage: true,
          skills: true,
          projectDescription: true,
          profileLinks: true,
        },
      },
    },
  });
};

exports.getCandidateDetailsForCompanyViewDetails = async (id) => {
  return await prisma.interns.findFirst({
    where: {
      id: id,
      isDelete: false,
    },
    select: {
      profilePicture: true,
      // city: true,
      // state: true,
      // country: true,
      email: true,
      gender: true,
      countryCode: true,
      mobileNumber: true,
      DOB: true,
      highestQualification: true,
      collageOrUniversityName: true,
      degreeOrCourse: true,
      yosOrGraduationYear: true,
      // cgpaOrPercentage: true,
      skills: true,
      resume : true,
      // projectDescription: true,
      // profileLinks: true,
      fullName: true,
      personalDetails : true,
      projectLink : true
      // internAbout: true,
    },
  });
};

exports.downloadResume = async (id) => {
  return await prisma.candidateManagement.findFirst({
    where: {
      id: id,
      isDelete: false,
    },
    select: {
      intern: {
        select: {
          resume: true,
          fullName: true,
        },
      },
    },
  });
};
