const { CronJob } = require("cron");
const prisma = require("../config/database");
const { placeCallAttempt } = require("../services/AICall/aiCall.service");

const job = new CronJob("*/15 * * * * *", async () => {
  // Runs every minute — find campaigns due for their next call attempt
  const pendingCalls = await prisma.aICall.findMany({
    where: {
      allAttemptsExhausted: false,
      status: { notIn: ["COMPLETED", "CALLING", "FAILED"] },
      nextCallAt: { lte: new Date() },
      attemptNumber: { lt: 3 },
    },
  });

  if (pendingCalls.length === 0) return;

  console.log(`⏰ 0: ${pendingCalls.length} campaign(s) due`);

  for (const aiCall of pendingCalls) {
    placeCallAttempt(aiCall).catch((err) =>
      console.error(`❌ placeCallAttempt failed for ${aiCall.id}:`, err),
    );
  }
});

job.start();
