const prisma = require("../../config/database");

exports.fetchedDownloadedResume = async (id, companyId) => {
  return await prisma.downloadedResumes.findFirst({
    where: {
      internId: id,
      companyId: companyId,
    },
  });
};

exports.fetchIndustryBasedOnId = async (id) => {
  return await prisma.jobCategory.findUnique({
    where: {
      id: id,
    },
  });
};

exports.fetchDownloadedResumeBasedOnId = async (id) => {
  return await prisma.downloadedResumes.findUnique({
    where: {
      id: id,
    },
  });
};

exports.getAllResumeBankInterns = async (data, industryType) => {
  let {
    gender,
    jobCategoryIds,
    jobSubCategoryIds,
    location,
    typeOfInternship,
    status,
  } = data || {};

  let whereClause = {
    internStatus: "APPROVED",
    isDelete: false,
    isProfileComplate: true,
    industry: industryType,
    isResumeActive : true,
    isResumeDeleted : false
  };
  if (Array.isArray(jobCategoryIds) && jobCategoryIds.length > 0) {
    whereClause.industry = {
      in: jobCategoryIds,
    };
  }

  if (Array.isArray(jobSubCategoryIds) && jobSubCategoryIds.length > 0) {
    whereClause.department = {
      in: jobSubCategoryIds,
    };
  }
  if (gender) {
    whereClause.gender = { in: Array.isArray(gender) ? gender : [gender] };
  }
  if (Array.isArray(typeOfInternship) && typeOfInternship.length > 0) {
    whereClause.internshipType = {
      in: Array.isArray(typeOfInternship)
        ? typeOfInternship
        : [typeOfInternship],
    };
  }
  if (Array.isArray(location) && location.length > 0) {
    whereClause.city = {
      in: Array.isArray(location)
        ? location.map((l) => l.toLowerCase())
        : [location.toLowerCase()],
      mode: "insensitive", 
    };
  }
  let alreadyDownloadedInterns = await prisma.downloadedResumes.findMany({
    where: {
      companyId: data.companyId,
    },
  });

  if (alreadyDownloadedInterns.length > 0) {
    whereClause.id = {
      notIn: alreadyDownloadedInterns.map((intern) => intern.internId),
    };
  }

  return await prisma.interns.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      profilePicture: true,
      city: true,
      highestQualification: true,
      collageOrUniversityName: true,
      degreeOrCourse: true,
      skills: true,
      projectDescription: true,
      profileLinks: true,
      createdAt: true,
      internshipType: true,
      internAbout : true,
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
  });
};

exports.resumeBankResumeDownload = async (id) => {
  return await prisma.interns.findUnique({
    where: {
      id: id,
    },
    select: {
      resume: true,
    },
  });
};

exports.saveResumeDownload = async (internId, companyId) => {
  return await prisma.downloadedResumes.create({
    data: {
      internId: internId,
      companyId: companyId,
      resumeStatus: "REVIEW",
    },
  });
};

exports.getDownloadedResumes = async (data) => {
  let {
    companyId,
    resumeStatus,
    startDate,
    endDate,
    gender,
    jobCategoryIds,
    jobSubCategoryIds,
    location,
    typeOfInternship,
  } = data || {};

  let whereClause = {
    companyId: companyId,
  };
  if (resumeStatus) {
    whereClause.resumeStatus = resumeStatus;
  }
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }
  if (
    gender ||
    (Array.isArray(jobCategoryIds) && jobCategoryIds.length > 0) ||
    (Array.isArray(jobSubCategoryIds) && jobSubCategoryIds.length > 0) ||
    (Array.isArray(location) && location.length > 0) ||
    (Array.isArray(typeOfInternship) && typeOfInternship.length > 0)
  ) {
    whereClause.intern = {};
  }

  if (gender) {
    whereClause.intern.gender = gender;
  }

  if (Array.isArray(jobCategoryIds) && jobCategoryIds.length > 0) {
    whereClause.intern.industry = { in: jobCategoryIds };
  }

  if (Array.isArray(jobSubCategoryIds) && jobSubCategoryIds.length > 0) {
    whereClause.intern.department = { in: jobSubCategoryIds };
  }

  if (Array.isArray(location) && location.length > 0) {
    whereClause.intern.city = {
      in: location.map((l) => l.toLowerCase()),
      mode: "insensitive",
    };
  }

  if (Array.isArray(typeOfInternship) && typeOfInternship.length > 0) {
    whereClause.intern.internshipType = { in: typeOfInternship };
  }

  return await prisma.downloadedResumes.findMany({
    where: whereClause,
    select: {
      id: true,
      internId: true,
      companyId: true,
      resumeStatus: true,
      createdAt: true,
      intern: {
        select: {
          fullName: true,
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
          profilePicture: true,
          projectDescription: true,
          highestQualification: true,
          preferedLocation: true,
          skills: true,
          internshipType: true,
          city: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.deleteDownloadedResume = async (id) => {
  return await prisma.downloadedResumes.delete({
    where: {
      id: id,
    },
  });
};

exports.updateDownloadedResumeStatus = async (id, status) => {
  return await prisma.downloadedResumes.update({
    where: {
      id: id,
    },
    data: {
      resumeStatus: status,
    },
  });
};

exports.getInternCityForResumeFilter = async () => {
  return await prisma.interns.findMany({
    where: {
      internStatus: "APPROVED",
      isDelete: false,
      isProfileComplate: true,
    },
    select: {
      city: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.getInternIndustriesForResumeFilter = async () => {
  return await prisma.interns.findMany({
    where: {
      internStatus: "APPROVED",
      isDelete: false,
      isProfileComplate: true,
    },
    select: {
      industryType: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.getIndustriesBasedOnIds = async (ids) => {
  return await prisma.jobCategory.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      categoryName: true,
      id: true,
    },
  });
};

exports.getDepartMentsBasedOnIndustryId = async (id) => {
  return await prisma.interns.findMany({
    where: {
      industry: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      department: true,
      jobSubCategory: {
        select: {
          id: true,
          subCategoryName: true,
        },
      },
    },
  });
};

exports.getResumesForTheAdminResumeBank = async (activeTab) => {
  return await prisma.interns.findMany({
    where: {
      internStatus: "APPROVED",
      isDelete: false,
      isProfileComplate: true,
      isResumeActive : activeTab,
      isResumeDeleted: false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      countryCode: true,
      mobileNumber: true,
      profilePicture: true,
      DOB: true,
      gender: true,
      city: true,
      state: true,
      isResumeActive: true,
      isProfileComplate: true,
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
      country: true,
      preferedLocation: true,
      highestQualification: true,
      collageOrUniversityName: true,
      degreeOrCourse: true,
      yosOrGraduationYear: true,
      cgpaOrPercentage: true,
      skills: true,
      resume: true,
      internshipType: true,
      durationPreference: true,
      language: true,
      profileLinks: true,
      internStatus: true,
    },
  });
};

exports.updateResumeStatus = async (id) => {
  const intern = await prisma.interns.findUnique({
    where: { id },
    select: { isResumeActive: true },
  });
  if (!intern) {
    return;
  }
  const updated = await prisma.interns.update({
    where: { id },
    data: {
      isResumeActive: !intern.isResumeActive,
    },
  });

  return updated;
};

exports.deleteResumeFromResumeBank = async (id)=>{
  return await prisma.interns.update({
    where : {
      id : id
    },
    data : {
      isResumeDeleted : true
    }
  })
}

exports.updateBulkResumeStatus = async (ids,status)=>{
  return await prisma.interns.updateMany({
    where : {
      id : {
        in : ids
      }
    },
    data : {
      isResumeActive : status
    }
  })
}