const { CronJob } = require("cron");
const prisma = require("../config/database");
const {
  generateJobEvaluationPrompt,
} = require("../helpers/generateJobScorePrompt");
const {
  GenerateJobScoreDetails,
  GenerateCompanyScore,
} = require("../helpers/geminiApi");
const {
  generateCompanyEvaluationPrompt,
} = require("../helpers/generateCompanyEvaluationScore");
const validateJobDescription = require("../helpers/validateJobDescription");

async function getPendingJobs() {
  return await prisma.job.findMany({
    where: {
      jobStatus: "REVIEW",
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
      location: true,
      stipend: true,
      additionalBenefits: true,
      jobType: true,
      jobStatus: true,
      createdAt: true,
    },
    take: 5,
  });
}

async function getCompanyPendingList() {
  return await prisma.company.findMany({
    where: {
      isDelete: false,
      companyStatus: "PENDING",
    },
  });
}

async function generateJobScore() {
  try {
    let pendingJobs = await prisma.job.findFirst({
      where: {
        isDelete: false,
        jobStatus: "REVIEW",
        score: 0,
      },
      select: {
        id: true,
        companyId: true,
        jobTitle: true,
        jobCategoryId: true,
        jobSubCategoryId: true,
        internshipDuration: true,
        workingHours: true,
        score: true,
        skills: true,
        aboutJob: true,
        otherRequirements: true,
        numberOfOpenings: true,
        location: true,
        stipend: true,
        minStipend: true,
        maxStipend: true,
        additionalBenefits: true,
        jobType: true,
        jobStatus: true,
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

    let score;
    if (pendingJobs) {
      const validation = await validateJobDescription(pendingJobs);
      if (!validation.isValid) {
        await prisma.job.update({
          where: {
            id: pendingJobs.id,
          },
          data: {
            jobStatus: "REJECTED",
            rejectReason: validation.reasons.join(","),
          },
        });
        return;
      }
      let prompt = await generateJobEvaluationPrompt(pendingJobs);
      score = await GenerateJobScoreDetails(prompt);
      await prisma.job.update({
        where: {
          id: pendingJobs.id,
        },
        data: {
          score: score,
        },
      });
    }

    return score;
  } catch (error) {
    console.error(error);
  }
}

async function generateCompanyScore() {
  try {
    let pendingCompanies = await prisma.company.findFirst({
      where: {
        isDelete: false,
        isProfileCompleted: true,
        companyStatus: "PENDING",
        AiScore: 0,
      },
    });
    let score;
    if (pendingCompanies) {
      let prompt = await generateCompanyEvaluationPrompt(pendingCompanies);
      score = await GenerateCompanyScore(prompt);
      if (score.success) {
        await prisma.company.update({
          where: {
            id: pendingCompanies.id,
          },
          data: {
            AiScore: score.score,
          },
        });
      }
    }
    return score;
  } catch (error) {
    console.error(error);
  }
}

async function getExpiredSubscriptions() {
  await prisma.companySubscription.updateMany({
    where: {
      isActive: true,
      subscriptionEnd: {
        lt: new Date(),
      },
    },
    data: {
      isActive: false,
    },
  });
}

async function getExpiredJobs() {
  try {
    const now = new Date();

    const expiredJobs = await prisma.job.findMany({
      where: {
        jobExpireDate: {
          lt: now,
        },
        jobStatus: "APPROVED",
      },
    });

    if (expiredJobs.length > 0) {
      await prisma.job.updateMany({
        where: {
          jobExpireDate: {
            lt: now,
          },
          NOT: {
            jobStatus: "COMPLETED",
          },
        },
        data: {
          jobStatus: "COMPLETED",
        },
      });

    } else {
    }

    return expiredJobs;
  } catch (error) {
    // console.error("❌ Error updating expired jobs:", error);
  }
}

async function getJobPostingExpired() {
  try {
    let expiredCredits = await prisma.companySubscription.findMany({
      where: {
        isActive: true,
        
        OR : [
          {
            jobPostingCredits : {
              lte : 0
            }
          },
          {
            resumeAccessCredits : {
              lte : 0
            }
          }
        ]
      },
    });
    if (expiredCredits.length > 0) {
      await prisma.companySubscription.updateMany({
        where: {
          isActive: true,
          OR : [
            {
              jobPostingCredits : {
                lte : 0
              }
            },
            {
              resumeAccessCredits : {
                lte : 0
              }
            }
          ]
        },
        data: {
          isActive: false,
        },
      });
    } else {
    }
  } catch (error) {
    console.error(error);
  }
}


// const job1 = new CronJob("*/5 * * * *", async () => {
//   try {
//     // await generateJobScore();
//     await generateCompanyScore();
//         console.log("company score crone ====>");

//   } catch (error) {
//     console.error("Error fetching pending jobs:", error);
//   }
// });
// const job2 = new CronJob("0 * * * *", async () => {
//   try {
//     console.log("subscription crone ====>");

//     // await generateJobScore();
//     await getExpiredSubscriptions();
 
//   } catch (error) {
//     console.error("Error fetching pending jobs:", error);
//   }
// });
// const job3 = new CronJob("0 * * * *", async () => {
//   try {
//     // await generateJobScore();
//         console.log("expire job crone ====>");

//     await getExpiredJobs();
  
//   } catch (error) {
//     console.error("Error fetching pending jobs:", error);
//   }
// });
// const job4 = new CronJob("0 * * * *", async () => {
//   try {
//     // await generateJobScore();
//       console.log("job posting expire  crone ====>");

//     await getJobPostingExpired();
//   } catch (error) {
//     console.error("Error fetching pending jobs:", error);
//   }
// });




















const job1 = new CronJob("*/30 * * * * *", async () => {
  try {
    // await generateJobScore();
    await generateCompanyScore();
        console.log("company score crone ====>");

  } catch (error) {
    console.error("Error fetching pending jobs:", error);
  }
});
const job2 = new CronJob("*/30 * * * * *", async () => {
  try {
    console.log("subscription crone ====>");

    // await generateJobScore();
    await getExpiredSubscriptions();
 
  } catch (error) {
    console.error("Error fetching pending jobs:", error);
  }
});
const job3 = new CronJob("*/30 * * * * *", async () => {
  try {
    // await generateJobScore();
        console.log("expire job crone ====>");

    await getExpiredJobs();
  
  } catch (error) {
    console.error("Error fetching pending jobs:", error);
  }
});
const job4 = new CronJob("*/30 * * * * *", async () => {
  try {
    // await generateJobScore();
      console.log("job posting expire  crone ====>");

    await getJobPostingExpired();
  } catch (error) {
    console.error("Error fetching pending jobs:", error);
  }
});

job1.start();
job2.start();
job3.start();
job4.start();

