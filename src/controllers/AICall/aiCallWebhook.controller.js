const crypto = require("crypto");
const prisma = require("../../config/database");
const { scheduleNextAttempt } = require("../../services/AICall/aiCall.service");
const { scoringQueue } = require("../../jobs/scoringWorker");

function verifyRetellSignature(req) {
  const signature = req.headers["x-retell-signature"];
  if (!signature || !process.env.RETELL_API_KEY) return false;

  const match = /^v=(\d+),d=([a-fA-F0-9]+)$/.exec(signature);
  if (!match) return false;

  const [, timestamp, digest] = match;
  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs)) return false;

  const fiveMinutesMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - timestampMs) > fiveMinutesMs) return false;

  const rawBody =
    typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(req.body);

  const hmac = crypto.createHmac("sha256", process.env.RETELL_API_KEY);
  hmac.update(`${rawBody}${timestamp}`);
  const expected = hmac.digest("hex");

  if (digest.length !== expected.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(digest, "hex"),
    Buffer.from(expected, "hex"),
  );
}

function buildConversationText(transcript) {
  if (typeof transcript === "string") return transcript;
  if (!Array.isArray(transcript)) return "";

  return transcript
    .map((turn) => {
      const role = turn.role === "agent" ? "Interviewer" : "Candidate";
      const content = turn.content || turn.words || "";
      return `${role}: ${content}`;
    })
    .join("\n");
}

async function retryCall(callId, status, duration, failReason) {
  const aiCall = await prisma.aICall.findUnique({ where: { id: callId } });
  if (!aiCall) return;

  await prisma.aICall.update({
    where: { id: callId },
    data: {
      conversationState: "INTRO",
      interviewCompleted: false,
      currentQuestionIndex: 0,
      repeatCount: 0,
    },
  });

  await scheduleNextAttempt(callId, aiCall.attemptNumber);
}

exports.webhookRetell = async (req, res) => {
  res.sendStatus(200);

  if (process.env.NODE_ENV === "production" && !verifyRetellSignature(req)) {
    console.warn("⚠️ [Retell Webhook] Invalid signature — ignoring");
    return;
  }

  const { event, call } = req.body || {};
  const retellCallId = call?.call_id;
  const metadata = call?.metadata || {};
  const callId = metadata.callId;
  const attemptId = metadata.attemptId;

  console.log(
    `📞 [Retell Webhook] event=${event}, retellCallId=${retellCallId}, callId=${callId}`,
  );

  if (!callId || !attemptId) {
    console.warn("⚠️ [Retell Webhook] Missing call metadata — cannot process");
    return;
  }

  try {
    if (event === "call_started") {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          answeredAt: new Date(),
          status: "IN_PROGRESS",
          retellCallId,
        },
      });
      return;
    }

    if (event !== "call_ended") return;

    const endReason = call.disconnection_reason || call.end_reason || "";
    const durationMs = call.duration_ms || 0;
    const durationSec = Math.round(durationMs / 1000);
    const conversationText = buildConversationText(call.transcript);

    const noAnswerReasons = ["user_not_picked_up", "no_answer", "busy"];
    const machineReasons = ["voicemail_reached", "machine_detected"];
    const failReasons = ["call_failed", "error"];

    if (noAnswerReasons.includes(endReason)) {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          status: "NOT_ANSWERED",
          duration: durationSec,
          failReason: endReason,
          retellCallId,
        },
      });
      await retryCall(callId);
      return;
    }

    if (machineReasons.includes(endReason)) {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          status: "MACHINE_DETECTED",
          duration: durationSec,
          failReason: "Answering machine detected",
          retellCallId,
        },
      });
      await retryCall(callId);
      return;
    }

    if (failReasons.includes(endReason)) {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          status: "FAILED",
          duration: durationSec,
          failReason: endReason,
          retellCallId,
        },
      });
      await retryCall(callId);
      return;
    }

    const didAttend = conversationText.length > 20 && durationSec > 15;
    if (!didAttend) {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          status: "ANSWERED_DROPPED",
          duration: durationSec,
          retellCallId,
        },
      });
      await retryCall(callId);
      return;
    }

    await scoringQueue.add(
      "score-call",
      { callId, attemptId, durationSec, conversationText },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
    );

    console.log(`📬 [Retell Webhook] Scoring job enqueued for callId=${callId}`);
  } catch (err) {
    console.error("❌ [Retell Webhook] Unhandled error:", err);
  }
};
