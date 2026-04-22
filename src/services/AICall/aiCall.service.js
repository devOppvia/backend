require("dotenv").config();
const twilio = require("twilio");
const prisma = require("../../config/database");
// const { prepareCallAudio } = require("../../helpers/aiCallHelper"); // No longer needed — X AI Realtime handles audio dynamically

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const BASE_URL =
  process.env.BACKEND_PUBLIC_URL ||
  "https://d047-2401-4900-1f3f-fb81-5598-93c-ca59-bcae.ngrok-free.app/api/v1";

// Delay in ms for each retry after a failed attempt
const RETRY_DELAYS = {
  1: 3 * 60 * 1000, // after attempt 1 fails → wait 3 minutes
  2: 3 * 60 * 1000, // after attempt 2 fails → wait 3 minutes
};

/**
 * Called right after scoring. Creates the AICall campaign record
 * and sets nextCallAt = now + 10 minutes. Does NOT dial immediately.
 */
async function createAICallCampaign({
  internId,
  jobId,
  companyId,
  candidateManagementId,
  triggerScore,
}) {
  // Check if a campaign already exists for this application (avoid duplicates)
  const existing = await prisma.aICall.findFirst({
    where: { internId, jobId, candidateManagementId },
  });
  if (existing) return existing;

  // const nextCallAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
  const nextCallAt = new Date(Date.now() + 15 * 1000); // 1 minute

  const aiCall = await prisma.aICall.create({
    data: {
      internId,
      jobId,
      companyId,
      candidateManagementId,
      triggerScore,
      status: "PENDING",
      attemptNumber: 0,
      nextCallAt,
      allAttemptsExhausted: false,
    },
  });

  console.log(
    `📋 AI Call campaign created: ${aiCall.id} — first call at ${nextCallAt.toISOString()}`,
  );
  return aiCall;
}

/**
 * Called by the retry cron job. Places a Twilio call for a pending AICall campaign.
 * Creates an AICallAttempt record for this attempt.
 */
async function placeCallAttempt(aiCall) {
  const intern = await prisma.interns.findUnique({
    where: { id: aiCall.internId },
    select: { mobileNumber: true, fullName: true },
  });

  if (!intern?.mobileNumber) {
    console.warn(
      `⚠️ Intern ${aiCall.internId} has no mobile number — exhausting campaign`,
    );
    await prisma.aICall.update({
      where: { id: aiCall.id },
      data: { status: "ALL_ATTEMPTS_EXHAUSTED", allAttemptsExhausted: true },
    });
    return;
  }

  const company = await prisma.company.findUnique({
    where: { id: aiCall.companyId },
    select: { companyName: true },
  });

  const job = await prisma.job.findUnique({
    where: { id: aiCall.jobId },
    select: { jobTitle: true },
  });

  // Fetch active questions (job-specific first, then company-level fallback)
  let questions = await prisma.aICallQuestion.findMany({
    where: { companyId: aiCall.companyId, jobId: aiCall.jobId, isActive: true },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    questions = await prisma.aICallQuestion.findMany({
      where: { companyId: aiCall.companyId, jobId: null, isActive: true },
      orderBy: { order: "asc" },
    });
  }

  if (questions.length === 0) {
    console.warn(
      `⚠️ No questions configured for company ${aiCall.companyId} — exhausting campaign`,
    );
    await prisma.aICall.update({
      where: { id: aiCall.id },
      data: { status: "ALL_ATTEMPTS_EXHAUSTED", allAttemptsExhausted: true },
    });
    return;
  }

  // Pre-generate X AI TTS audio — no longer needed, X AI Realtime handles audio dynamically
  // await prepareCallAudio(company.companyName, company?.aiCallIntro, questions);

  const newAttemptNumber = aiCall.attemptNumber + 1;

  // Mark campaign as CALLING and increment attempt counter
  await prisma.aICall.update({
    where: { id: aiCall.id },
    data: {
      status: "CALLING",
      attemptNumber: newAttemptNumber,
      nextCallAt: null,
    },
  });

  // Create the attempt record
  const attempt = await prisma.aICallAttempt.create({
    data: {
      aiCallId: aiCall.id,
      attemptNumber: newAttemptNumber,
      status: "IN_PROGRESS",
      scheduledAt: new Date(),
    },
  });

  // Place the Twilio call
  const phone = intern.mobileNumber.startsWith("+")
    ? intern.mobileNumber
    : `+91${intern.mobileNumber}`;

  const call = await twilioClient.calls.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: `${BASE_URL}/ai-call/webhook/intro/${aiCall.id}/${attempt.id}`,
    statusCallback: `${BASE_URL}/ai-call/webhook/complete/${aiCall.id}/${attempt.id}`,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["completed", "failed", "no-answer", "busy"],
    timeout: 30,
    machineDetection: "Enable",
  });

  // Save Twilio Call SID to the attempt
  await prisma.aICallAttempt.update({
    where: { id: attempt.id },
    data: { callSid: call.sid },
  });

  console.log(
    `📞 AI Call attempt ${newAttemptNumber} placed: ${aiCall.id} → ${phone} (SID: ${call.sid})`,
  );
}

/**
 * Called after a failed attempt to schedule the next one or exhaust the campaign.
 */
async function scheduleNextAttempt(aiCallId, attemptNumber) {
  if (attemptNumber >= 3) {
    await prisma.aICall.update({
      where: { id: aiCallId },
      data: {
        status: "ALL_ATTEMPTS_EXHAUSTED",
        allAttemptsExhausted: true,
        nextCallAt: null,
      },
    });
    console.log(
      `🚫 AI Call campaign ${aiCallId} exhausted after ${attemptNumber} attempts`,
    );
    return;
  }

  const delayMs = RETRY_DELAYS[attemptNumber];
  const nextCallAt = new Date(Date.now() + delayMs);

  await prisma.aICall.update({
    where: { id: aiCallId },
    data: { status: "PENDING", nextCallAt },
  });

  console.log(
    `🔄 AI Call campaign ${aiCallId} — attempt ${attemptNumber + 1} scheduled at ${nextCallAt.toISOString()}`,
  );
}

module.exports = {
  createAICallCampaign,
  placeCallAttempt,
  scheduleNextAttempt,
};
