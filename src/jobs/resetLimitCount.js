const { CronJob } = require("cron");
const prisma = require("../config/database");

async function getForgotAttempts() {
  await prisma.company.updateMany({
    where: {
      forgotPasswordAttemts: {
        gte: 1,
      },
    },
    data: {
      forgotPasswordAttemts: 0,
    },
  });
}

async function getEmailAndMobileAttempts() {
  await prisma.interns.updateMany({
    where: {
      otpAttempts: {
        gte: 1,
      },
      emailOtpAttempts: {
        gte: 1,
      },
    },
    data: {
      otpAttempts: 0,
      emailOtpAttempts: 0,
    },
  });
}

const job1 = new CronJob("0 0 * * *", async () => {
  await getForgotAttempts();
});

const job2 = new CronJob("*/15 * * * *", async () => {
    console.log("This runs every 15 minutes ⏱️");
  await getEmailAndMobileAttempts();
});

job1.start();
job2.start();
