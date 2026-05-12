require("dotenv").config();
const fetch = require("node-fetch");
const prisma = require("../../config/database");
// const { prepareCallAudio } = require("../../helpers/aiCallHelper"); // No longer needed — X AI Realtime handles audio dynamically

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
 * Called by the retry cron job. Places a Retell call for a pending AICall campaign.
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

  const newAttemptNumber = aiCall.attemptNumber + 1;

  // Mark campaign as CALLING and increment attempt counter
  await prisma.aICall.update({
    where: { id: aiCall.id },
    data: {
      status: "CALLING",
      attemptNumber: newAttemptNumber,
      nextCallAt: null,
      currentQuestionIndex: 0,
      interviewCompleted: false,
      repeatCount: 0,
      conversationState: "INTRO",
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

  const phone = intern.mobileNumber.startsWith("+")
    ? intern.mobileNumber
    : `+91${intern.mobileNumber}`;

  const missingRetellEnv = [
    "RETELL_API_KEY",
    "RETELL_AGENT_ID",
    "RETELL_FROM_NUMBER",
  ].filter((key) => !process.env[key]);

  if (missingRetellEnv.length > 0) {
    const reason = `Missing Retell env: ${missingRetellEnv.join(", ")}`;
    console.error(`❌ ${reason}`);
    await prisma.aICallAttempt.update({
      where: { id: attempt.id },
      data: { status: "FAILED", failReason: reason },
    });
    await scheduleNextAttempt(aiCall.id, newAttemptNumber);
    return;
  }

  const retellResponse = await fetch(
    "https://api.retellai.com/v2/create-phone-call",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_number: process.env.RETELL_FROM_NUMBER,
        to_number: phone,
        agent_id: process.env.RETELL_AGENT_ID,
        metadata: { callId: aiCall.id, attemptId: attempt.id },
      }),
    },
  );

  if (!retellResponse.ok) {
    const errBody = await retellResponse.text();
    console.error(`❌ Retell API error: ${retellResponse.status} — ${errBody}`);
    await prisma.aICallAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "FAILED",
        failReason: `Retell API error: ${retellResponse.status}`,
      },
    });
    await scheduleNextAttempt(aiCall.id, newAttemptNumber);
    return;
  }

  const retellData = await retellResponse.json();
  const retellCallId = retellData.call_id;

  await prisma.aICallAttempt.update({
    where: { id: attempt.id },
    data: { retellCallId },
  });


  console.log(
    `📞 AI Call attempt ${newAttemptNumber} placed via Retell: ${aiCall.id} → ${phone} (retellCallId: ${retellCallId})`,
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
