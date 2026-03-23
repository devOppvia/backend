const prisma = require("../../config/database");
const { getPagination, getPagingData } = require("../../utils/getPagination");

exports.getJobAlertInternPanel = async (
  internId,
  status,
  itemsPerPage,
  currentPage
) => {
  let whereClause = {
    isDelete: false,
    internId: internId,
  };
  if (status) {
    whereClause.candidateStatus = status;
  }
  let { skip, take } = getPagination(currentPage, itemsPerPage);
  let totalAppliedJobs = await prisma.candidateManagement.count({
    where: whereClause,
  });
  let appliedJobs = await prisma.candidateManagement.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      internId: true,
      companyId: true,
      isJoined: true,
      intern: {
        select: {
          isOpenToWork: true,
        },
      },
      company: {
        select: {
          logo: true,
          smallLogo: true,
          companyName: true,
        },
      },
      jobId: true,
      job: {
        select: {
          jobTitle: true,
          aboutJob: true,
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
          jobType: true,
          skills: true,
          stipend: true,
          minStipend: true,
          maxStipend: true,
        },
      },
      candidateStatus: true,
    },
    skip,
    take,
  });
  let totalJobs = await prisma.candidateManagement.count({
    where: {
      isDelete: false,
      internId: internId,
    },
  });
  return {
    totalAppliedJobs,
    appliedJobs,
    pagination : getPagingData(totalJobs, currentPage, itemsPerPage)
  };
};

exports.deleteInternAccount = async (internId) => {
  return await prisma.interns.update({
    where: {
      id: internId,
    },
    data: {
      isDelete: true,
    },
  });
};
