const prisma = require("../../config/database");

function calculatePercentageChange(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}

exports.getCompanyDashboardDetails = async (companyId) => {
  const now = new Date();

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = now;

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let [totalJobsPosted, currentMonthJobs, lastMonthJobs] = await Promise.all([
    prisma.job.count({
      where: { isDelete: false, companyId },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        companyId,
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    }),
    prisma.job.count({
      where: {
        isDelete: false,
        companyId,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
  ]);
  let [totalCandidatesApplied, currentMonthApplied, lastMonthApplied] =
    await Promise.all([
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);
  let [totalResumeDownloaded, currentMonthDownloaded, lastMonthDownloaded] =
    await Promise.all([
      prisma.downloadedResumes.count({
        where: {
          companyId: companyId,
        },
      }),
      prisma.downloadedResumes.count({
        where: {
          companyId: companyId,
          updatedAt: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      }),
      prisma.downloadedResumes.count({
        where: {
          companyId: companyId,
          updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);
  let [totalHiredCandidates, currentMonthHired, lastMonthHired] =
    await Promise.all([
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          candidateStatus: "HIRED",
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          updatedAt: { gte: currentMonthStart, lte: currentMonthEnd },
          candidateStatus: "HIRED",
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
          candidateStatus: "HIRED",
        },
      }),
    ]);
  let jobPercentage = calculatePercentageChange(
    currentMonthJobs,
    lastMonthJobs,
  );
  let candidatePercentage = calculatePercentageChange(
    currentMonthApplied,
    lastMonthApplied,
  );
  let resumePercentage = calculatePercentageChange(
    currentMonthDownloaded,
    lastMonthDownloaded,
  );
  let candidateHirePercentage = calculatePercentageChange(
    currentMonthHired,
    lastMonthHired,
  );

  return [
    {
      label: "Openings",
      value: totalJobsPosted,
      percentage: Number(jobPercentage.toFixed(2)),
      icon: "",
    },
    {
      label: "Application",
      value: totalCandidatesApplied,
      percentage: Number(candidatePercentage.toFixed(2)),
      icon: "",
    },
    {
      label: "Resumes",
      value: totalResumeDownloaded,
      percentage: Number(resumePercentage.toFixed(2)),
      icon: "",
    },
    {
      label: "Hired",
      value: totalHiredCandidates,
      percentage: Number(candidateHirePercentage.toFixed(2)),
      icon: "",
    },
  ];
};

exports.getCompanyDashboardCandidateDetails = async (
  companyId,
  candidateStatus = "SHORTLISTED",
) => {
  let existingCandidate = await prisma.candidateManagement.findMany({
    where: {
      isDelete: false,
      companyId: companyId,
      candidateStatus: candidateStatus,
    },
    select: {
      createdAt: true,
    },
  });
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let dayWiseCount = daysOfWeek.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {});

  existingCandidate.forEach((candidate) => {
    const dayName = daysOfWeek[new Date(candidate.createdAt).getDay()];
    dayWiseCount[dayName]++;
  });

  return {
    totalCandidates: existingCandidate.length,
    dayWiseCount,
  };
};

exports.getCompanyDashboardJobDetails = async (companyId) => {
  let [AllCandidates, Shortlisted, Review, Interview, Hired, Rejected] =
    await Promise.all([
      prisma.candidateManagement.count({
        where: {
          companyId: companyId,
          isDelete: false,
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          candidateStatus: "SHORTLISTED",
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          candidateStatus: "REVIEW",
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          candidateStatus: "INTERVIEW",
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          candidateStatus: "HIRED",
        },
      }),
      prisma.candidateManagement.count({
        where: {
          isDelete: false,
          companyId: companyId,
          candidateStatus: "REJECTED",
        },
      }),
    ]);

  return {
    allCandidates: AllCandidates,
    shortListed: Shortlisted,
    review: Review,
    interview: Interview,
    hired: Hired,
    rejected: Rejected,
  };
};

exports.getCompanyDashboardRecentAppliedDetails = async (companyId) => {
  return await prisma.candidateManagement.findMany({
    where: {
      isDelete: false,
      companyId: companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
    select: {
      id: true,
      internId: true,
      interview: {
        select: {
          interviewDate: true,
          interviewLink: true,
          interviewLocation: true,
          interviewStatus: true,
          rejectReason: true,
          interviewTime: true,
          interviewType: true,
        },
      },
      intern: {
        select: {
          profilePicture: true,
          fullName: true,
          skills: true,
          gender: true,
          // city : true,
          isOpenToWork: true,
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
      companyId: true,
      candidateStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

exports.getJobByStatus = async (companyId) => {
  const [totalJobs, REVIEW, APPROVED, COMPLETED, REJECTED, DRAFT] =
    await Promise.all([
      prisma.job.count({
        where: {
          companyId: companyId,
        },
      }),
      prisma.job.count({
        where: {
          companyId: companyId,
          jobStatus: "REVIEW",
        },
      }),
      prisma.job.count({
        where: {
          companyId: companyId,
          jobStatus: "APPROVED",
        },
      }),
      prisma.job.count({
        where: {
          companyId: companyId,
          jobStatus: "COMPLETED",
        },
      }),
      prisma.job.count({
        where: {
          companyId: companyId,
          jobStatus: "REJECTED",
        },
      }),
      prisma.job.count({
        where: {
          companyId: companyId,
          jobStatus: "DRAFT",
        },
      }),
    ]);

  return {
    totalJobs,
    counts : {
      review: REVIEW,
      approved: APPROVED,

      completed: COMPLETED,
      rejected: REJECTED,
    }
  };
};

exports.getAllInterviewsByCompanyId = async (companyId) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - dayOfWeek);
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  return await prisma.interview.findMany({
    where: {
      companyId: companyId,
      createdAt: { gte: currentWeekStart, lte: currentWeekEnd },
    },
    include: {
      intern: {
        select: {
          profilePicture: true,
          fullName: true,
          email: true,
          mobileNumber: true,
          skills: true,
          gender: true,
        },
      },
      job: {
        select: {
          jobTitle: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.getCompanyCreditsAndStats = async (companyId) => {
  const [
    totalInterviews,
    totalHired,
    totalJobsPosted,
    totalDownloadedResumes,
    activeSubscription
  ] = await Promise.all([
    prisma.interview.count({
      where: { companyId: companyId }
    }),
    prisma.candidateManagement.count({
      where: { companyId: companyId, candidateStatus: "HIRED", isDelete: false }
    }),
    prisma.job.count({
      where: { companyId: companyId, isDelete: false }
    }),
    prisma.downloadedResumes.count({
      where: { companyId: companyId }
    }),
    prisma.companySubscription.findFirst({
      where: { companyId: companyId, isActive: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    totalInterviews,
    totalHired,
    totalJobsPosted,
    remainingJobCredits: activeSubscription ? activeSubscription.jobPostingCredits : 0,
    totalDownloadedResumes,
    remainingResumeCredits: activeSubscription ? activeSubscription.resumeAccessCredits : 0,
  };
};
