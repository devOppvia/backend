const { all } = require("axios");
const prisma = require("../../config/database");

exports.getDashboardDetails = async (data) => {
  console.log("this is")
  let [allCompany, pendingCompany, approvedCompany, rejectedCompany] =
    await Promise.all([
      prisma.company.count({
        where: {
          isDelete: false,
          isProfileCompleted: true,
        },
      }),
      prisma.company.count({
        where: {
          isDelete: false,
          companyStatus: "PENDING",
          isProfileCompleted: true,
        },
      }),
      prisma.company.count({
        where: {
          isDelete: false,
          companyStatus: "APPROVED",
          isProfileCompleted: true,
        },
      }),
      prisma.company.count({
        where: {
          isDelete: false,
          companyStatus: "REJECTED",
          isProfileCompleted: true,
        },
      }),
    ]);
  let totalCompanies = pendingCompany + approvedCompany + rejectedCompany;
  let companyStatusPercent = {
    pending: totalCompanies
      ? ((pendingCompany / totalCompanies) * 100).toFixed(2)
      : 0,
    approved: totalCompanies
      ? ((approvedCompany / totalCompanies) * 100).toFixed(2)
      : 0,
    rejected: totalCompanies
      ? ((rejectedCompany / totalCompanies) * 100).toFixed(2)
      : 0,
  };
  let [totalSupport, openSupport, closedSupport] = await Promise.all([
    prisma.support.count(),
    prisma.support.count({
      where: {
        status: "OPEN",
      },
    }),
    prisma.support.count({
      where: {
        status: "CLOSED",
      },
    }),
  ]);
  let { pending, approved, rejected } = companyStatusPercent;
  let companyStatus = [
    allCompany,
    pendingCompany,
    approvedCompany,
    rejectedCompany,
  ];
  let companyPercentage = [pending, approved, rejected];
  let supportCount = [totalSupport, openSupport, closedSupport];

  let [All, Review, Approved, Paused, Completed, Rejected] = await Promise.all([
    prisma.job.count({
      where: {
        isDelete: false,
        NOT: {
          jobStatus: "DRAFT",
        },
      },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        jobStatus: "REVIEW",
      },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        jobStatus: "APPROVED",
      },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        jobStatus: "PAUSED",
      },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        jobStatus: "COMPLETED",
      },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        jobStatus: "REJECTED",
      },
    }),
  ]);
  let jobStatus = [ {label : "REVIEW" , count : Review}, {label : "APPROVED" , count : Approved}, {label : "PAUSED" , count : Paused}, {label : "COMPLETED" , count : Completed}, {label : "REJECTED" , count : Rejected}];
  let totalJobCategories = await prisma.jobCategory.count({
    where: {
      isDelete: false,
    },
  });
  let totalRevenue = await prisma.paymentHistory.aggregate({
    _sum: {
      amountPaid: true,
    },
    where: {
      paymentStatus: "captured",
    },
  });

  const payments = await prisma.paymentHistory.findMany({
    where: {
      paymentStatus: "captured",
    },
    select: {
      amountPaid: true,
      purchasedAt: true,
    },
  });

  // Prepare month names or indices
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Initialize monthly totals
  const monthlyTotals = Array(12).fill(0);

  payments.forEach((p) => {
    if (p.purchasedAt && p.amountPaid) {
      const monthIndex = new Date(p.purchasedAt).getMonth(); // 0 - 11
      monthlyTotals[monthIndex] += p.amountPaid;
    }
  });

  const response = {
    name: "Total Revenue",
    data: monthlyTotals,
  };

  let unitCount = [
    totalRevenue._sum.amountPaid,
    (totalCompanies = totalCompanies),
    (totalPostedJobs = All),
    (totalCategories = totalJobCategories),
  ];
  return {
    unitCount,
    companyCount: companyStatus,
    companyPercentage: companyPercentage,
    jobStatus: jobStatus,
    supportCount: supportCount,
    revenueInsigts: [response],
  };
};
