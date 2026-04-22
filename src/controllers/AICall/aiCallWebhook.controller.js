const twilio = require("twilio");
const prisma = require("../../config/database");
const { scoreCallAnswers } = require("../../helpers/aiCallHelper");
const {
  getCallSession,
  deleteCallSession,
} = require("../../socket/openAirealtime");
const { scheduleNextAttempt } = require("../../services/AICall/aiCall.service");

const VoiceResponse = twilio.twiml.VoiceResponse;
const BASE_URL =
  process.env.BACKEND_PUBLIC_URL ||
  "https://d047-2401-4900-1f3f-fb81-5598-93c-ca59-bcae.ngrok-free.app/api/v1";

// ─── 1. INTRO — connects Twilio media stream to X AI Realtime ──────────────
// NOTE: On Twilio trial accounts, a "Press any key to continue" message plays first.
// We handle this by checking for Digits (keypress) — if present, proceed to stream.
// If no Digits, we <Gather> the keypress first, then redirect back here.
exports.webhookIntro = async (req, res) => {
  const { callId, attemptId } = req.params;

  // DEBUG: Log all request details
  console.log(`📞 [Intro Webhook] callId=${callId}, attemptId=${attemptId}`);
  console.log(
    `📞 [Intro Webhook] Digits=${req.body.Digits}, CallStatus=${req.body.CallStatus}`,
  );
  console.log(`📞 [Intro Webhook] AnsweredBy=${req.body.AnsweredBy}`);

  try {
    const aiCall = await prisma.aICall.findUnique({
      where: { id: callId },
    });

    if (!aiCall) {
      console.error(`❌ AICall ${callId} not found`);
      return res.status(404).send("<Response><Hangup/></Response>");
    }

    // Answering machine detected → mark attempt, schedule retry
    if (req.body.AnsweredBy === "machine_start") {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          status: "MACHINE_DETECTED",
          failReason: "Answering machine detected",
        },
      });
      await scheduleNextAttempt(callId, aiCall.attemptNumber);

      const twiml = new VoiceResponse();
      twiml.hangup();
      return res.type("text/xml").send(twiml.toString());
    }

    // Intern picked up — record answeredAt
    await prisma.aICallAttempt.update({
      where: { id: attemptId },
      data: { answeredAt: new Date() },
    });

    // ─── Connect directly to X AI Realtime stream ─────────────────────────
    // Build WebSocket URL: remove /api/v1 from BASE_URL, put callId/attemptId in PATH
    // NOTE: Twilio strips query strings from WebSocket connections, so we use path params
    const baseHost = BASE_URL.replace(/^https?:\/\//, "").replace(
      /\/api\/v1\/?$/,
      "",
    );
    const wsUrl = `wss://${baseHost}/media-stream/${callId}/${attemptId}`;

    console.log(`📞 [Stream mode] BASE_URL=${BASE_URL}, baseHost=${baseHost}`);
    console.log(`📞 [Stream mode] WebSocket URL: ${wsUrl}`);

    const twiml = new VoiceResponse();
    const connect = twiml.connect();
    connect.stream({
      url: wsUrl,
    });

    const twimlString = twiml.toString();
    console.log(`📞 [Stream mode] Stream TwiML: ${twimlString}`);
    console.log(`📞 [Stream mode] Sending TwiML for call ${callId}`);
    res.type("text/xml").send(twimlString);

    // ─── Old flow (commented out — pre-recorded audio + question/answer webhooks) ──
    // const introAudioUrl = `${UPLOAD_BASE_URL}/uploads/ai_call_audio/intro_${Buffer.from(companyName).toString("hex").slice(0, 12)}.mp3`;
    // const twiml = new VoiceResponse();
    // twiml.play(introAudioUrl);
    // twiml.redirect({ method: "POST" }, `${BASE_URL}/ai-call/webhook/question/${callId}/${attemptId}/0`);
    // res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("❌ Intro webhook error:", err);
    const twiml = new VoiceResponse();
    twiml.say("Sorry, there was an error. Goodbye.");
    twiml.hangup();
    res.type("text/xml").send(twiml.toString());
  }
};

// ─── 2. STATUS CALLBACK — call ended, score & store ────────────────────────
exports.webhookComplete = async (req, res) => {
  const { callId, attemptId } = req.params;
  const callStatus = req.body.CallStatus;
  const duration = parseInt(req.body.CallDuration || "0", 10);

  try {
    const aiCall = await prisma.aICall.findUnique({
      where: { id: callId },
      include: {
        company: { select: { companyName: true } },
        job: { select: { jobTitle: true } },
      },
    });

    if (!aiCall) return res.sendStatus(200);

    // ── Call was not answered ──────────────────────────────────────────────
    if (callStatus === "no-answer" || callStatus === "busy") {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: {
          status: "NOT_ANSWERED",
          duration,
          failReason: `Twilio status: ${callStatus}`,
        },
      });
      await scheduleNextAttempt(callId, aiCall.attemptNumber);
      deleteCallSession(callId);
      return res.sendStatus(200);
    }

    // ── Technical failure ──────────────────────────────────────────────────
    if (callStatus === "failed") {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: { status: "FAILED", duration, failReason: "Twilio call failed" },
      });
      await scheduleNextAttempt(callId, aiCall.attemptNumber);
      deleteCallSession(callId);
      return res.sendStatus(200);
    }

    // ── Call completed — retrieve conversation from session, score it ─────
    if (callStatus === "completed") {
      const session = getCallSession(callId);
      const conversationText = session?.conversationText || "";

      // If duration is very short or no conversation → intern dropped early
      const didAttend = conversationText.length > 20 && duration > 15;

      if (!didAttend) {
        await prisma.aICallAttempt.update({
          where: { id: attemptId },
          data: { status: "ANSWERED_DROPPED", duration },
        });
        await scheduleNextAttempt(callId, aiCall.attemptNumber);
        deleteCallSession(callId);
        return res.sendStatus(200);
      }

      // Score the conversation using X AI chat completions
      let callScore = null;
      let callSummary = null;

      console.log(
        `📞 [Call ${callId}] Conversation text:\n${conversationText}`,
      );

      try {
        const result = await scoreCallAnswers(
          aiCall.company.companyName,
          aiCall.job.jobTitle,
          conversationText,
        );
        console.log("result ======> ", result);

        callScore = result.callScore;
        callSummary = result.callSummary;
      } catch (scoreErr) {
        console.error("❌ Scoring failed:", scoreErr);
      }

      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: { status: "ANSWERED_COMPLETED", duration },
      });

      await prisma.aICall.update({
        where: { id: callId },
        data: {
          status: "COMPLETED",
          callScore,
          callSummary,
          transcript: conversationText,
        },
      });

      if (callScore !== null) {
        await prisma.candidateManagement.update({
          where: { id: aiCall.candidateManagementId },
          data: { score: Math.round(callScore), scoredReason: callSummary },
        });
      }

      console.log(`✅ AI Call ${callId} completed — score: ${callScore}`);
      console.log("callSummary", callSummary);

      deleteCallSession(callId);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Complete webhook error:", err);
    res.sendStatus(200); // always 200 to Twilio or it will retry
  }
};
