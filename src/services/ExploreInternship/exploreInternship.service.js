const prisma = require("../../config/database");

exports.getExploreInternshipFilter = async (data) => {
  let industries = await prisma.jobCategory.findMany({
    where: {
      isDelete: false,
      jobs: {
        some: {
          isDelete: false,
          jobStatus: "APPROVED",
        },
      },
    },
    select: {
      id: true,
      categoryName: true,
    },
  });
  let department = await prisma.jobSubCategory.findMany({
    where: {
      isDelete: false,
      jobs: {
        some: {
          isDelete: false,
          jobStatus: "APPROVED",
        },
      },
    },
    select: {
      id: true,
      subCategoryName: true,
    },
  });
  let companyLocations = await prisma.company.findMany({
    where: {
      isDelete: false,
      isProfileCompleted: true,
      companyStatus: "APPROVED",
      jobs: {
        some: {
          isDelete: false,
          jobStatus: "APPROVED",
        },
      },
    },
    select: {
      city: true,
    },
  });
  let states = await prisma.state.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  let skills = await prisma.skills.findMany({
    where: {
      isDelete: false,
    },
    select: {
      id: true,
      skillName: true,
    },
  });
  let typeOfInternship = ["REMOTE", "HYBRID", "OFFICE"];
  let typeOfEmployment = ["FULL_TIME", "PART_TIME" , "CONTRACT" , "ANY" ];

    

  return {
    industries,
    departments : department,
    states,
    skills,
   internshipTypes : typeOfInternship,
    employmentTypes : typeOfEmployment,
  };
};

exports.getExploreInternshipCompanies = async () => {
  const grouped = await prisma.company.groupBy({
    by: ["industryType"],
    where: {
      isDelete: false,
      companyStatus: "APPROVED",
      isProfileCompleted: true,
    },
    _count: { _all: true },
  });

  const industryIds = grouped.map((g) => g.industryType);
  const industries = await prisma.jobCategory.findMany({
    where: { id: { in: industryIds } },
    select: { id: true, categoryName: true },
  });

  const result = grouped.map((g) => {
    
    const industry = industries.find((i) => i.id === g.industryType);
    return {
      id : g.industryType,
      industryName: industry?.categoryName || "Unknown",
      companyCount: g._count._all,
    };
  });

  return result;
};

exports.getInternships = async () => {
  return await prisma.job.findMany({
    where: {
      isDelete: false,
      jobStatus: "APPROVED",
    },
    select: {
      id: true,
      companyId: true,
      company: {
        select: {
          id: true,
          companyName: true,
          logo: true,
        },
      },
      jobTitle: true,
      aboutJob: true,
      skills: true,
      stipend: true,
      minStipend: true,
      maxStipend: true,
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
      location: true,
      numberOfOpenings: true,
      internshipDuration: true,
    },
  });
};

exports.getInternshipBasicDetails = async (internshipId, companyId) => {
  return await prisma.job.findFirst({
    where: {
      isDelete: false,
      jobStatus: "APPROVED",
      id: internshipId,
      companyId: companyId,
    },
    select: {
      company: {
        select: {
          logo: true,
          companyName: true,
        },
      },
      jobTitle: true,
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
      internshipDuration: true,
      stipend: true,
      minStipend: true,
      maxStipend: true,
      id: true,
    },
  });
};

exports.getInternshipDetailsOverview = async (internshipId, companyId) => {
  return await prisma.job.findFirst({
    where: {
      isDelete: false,
      jobStatus: "APPROVED",
      id: internshipId,
      companyId: companyId,
    },
    select: {
      company: {
        select: {
          city: true,
        },
      },
      workingHours: true,
      internshipDuration: true,
      jobType: true,
      aboutJob: true,
      otherRequirements: true,
      skills: true,
      location: true,
      additionalBenefits: true,
    },
  });
};

exports.getInternshipDetailsJobs = async (internshipId, companyId) => {
  return await prisma.job.findMany({
    where: {
      isDelete: false,
      jobStatus: "APPROVED",
      id: internshipId,
      companyId: companyId,
    },
    select: {
      jobTitle: true,
      aboutJob: true,
      company: {
        select: {
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
      location: true,
      jobType: true,
      skills: true,
      stipend: true,
      minStipend: true,
      maxStipend: true,
      id: true,
    },
  });
};

exports.getInternshipDetailsCompany = async (companyId) => {
  return await prisma.company.findFirst({
    where: {
      isDelete: false,
      companyStatus: "APPROVED",
      isProfileCompleted: true,
      id: companyId,
    },
    select: {
      id: true,
      companyName: true,
      // industry: true,
      websiteUrl: true,
      address: true,
      hrAndRecruiterName: true,
      email: true,
      phoneNumber: true,
      countryCode: true,
      industryType: true,
      city: true,
      companyIntro: true,
      logo: true,
      smallLogo : true,
      branchLocation: true,
      companyStatus: true,
      createdAt: true,
    },
  });
};
