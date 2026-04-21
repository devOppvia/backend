const twilio = require("twilio");
const prisma = require("../../config/database");
const {
  scoreCallAnswers,
  correctCallAnswers,
} = require("../../helpers/aiCallHelper");
const { scheduleNextAttempt } = require("../../services/AICall/aiCall.service");

const VoiceResponse = twilio.twiml.VoiceResponse;
const BASE_URL =
  process.env.BACKEND_PUBLIC_URL ||
  "https://de2e-2401-4900-1c80-8af9-401e-d4e1-6646-d2d.ngrok-free.app/api/v1";
const UPLOAD_BASE_URL =
  process.env.UPLOAD_BASE_URL ||
  "https://de2e-2401-4900-1c80-8af9-401e-d4e1-6646-d2d.ngrok-free.app";

// ─── 1. INTRO — plays when intern picks up ────────────────────────────────────
exports.webhookIntro = async (req, res) => {
  const { callId, attemptId } = req.params;

  try {
    const aiCall = await prisma.aICall.findUnique({
      where: { id: callId },
      include: { company: { select: { companyName: true } } },
    });

    if (!aiCall) return res.status(404).send("<Response><Hangup/></Response>");

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

    const companyName = aiCall.company.companyName;
    const introAudioUrl = `${UPLOAD_BASE_URL}/uploads/ai_call_audio/intro_${Buffer.from(companyName).toString("hex").slice(0, 12)}.mp3`;

    const twiml = new VoiceResponse();
    twiml.play(introAudioUrl);
    twiml.redirect(
      { method: "POST" },
      `${BASE_URL}/ai-call/webhook/question/${callId}/${attemptId}/0`,
    );

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("❌ Intro webhook error:", err);
    const twiml = new VoiceResponse();
    twiml.say("Sorry, there was an error. Goodbye.");
    twiml.hangup();
    res.type("text/xml").send(twiml.toString());
  }
};
// ─── 2. QUESTION — plays question and listens ─────────────────────────────────
exports.webhookQuestion = async (req, res) => {
  const { callId, attemptId, questionIndex } = req.params;
  const qIdx = parseInt(questionIndex, 10);
  const retryCount = parseInt(req.params.retryCount || "0", 10);

  try {
    const aiCall = await prisma.aICall.findUnique({ where: { id: callId } });

    let questions = await prisma.aICallQuestion.findMany({
      where: {
        companyId: aiCall.companyId,
        jobId: aiCall.jobId,
        isActive: true,
      },
      orderBy: { order: "asc" },
    });
    if (questions.length === 0) {
      questions = await prisma.aICallQuestion.findMany({
        where: { companyId: aiCall.companyId, jobId: null, isActive: true },
        orderBy: { order: "asc" },
      });
    }

    res
      .type("text/xml")
      .send(
        buildQuestionTwiml(
          questions,
          qIdx,
          callId,
          attemptId,
          retryCount,
        ).toString(),
      );
  } catch (err) {
    console.error("❌ Question webhook error:", err);
    const twiml = new VoiceResponse();
    twiml.hangup();
    res.type("text/xml").send(twiml.toString());
  }
};

// ─── 3. ANSWER — saves answer, moves to next question ───────────────────────

// Single words: only match if the entire response is just that word
const REPEAT_EXACT = ["what", "huh", "sorry", "pardon"];
// Phrases: match anywhere in the response (still guarded by word count ≤8)
const REPEAT_PHRASES = [
  "repeat",
  "say again",
  "say that again",
  "can you repeat",
  "please repeat",
  "what did you say",
  "come again",
  "once more",
  "again please",
  "didn't hear",
  "couldn't hear",
  "not hear",
];

// retryCount: how many times this question has already been played with no response
// 0 = first play → on no-speech, repeat once (retryCount=1)
// 1 = second play → on no-speech, move to next question
function buildQuestionTwiml(
  questions,
  targetIdx,
  callId,
  attemptId,
  retryCount = 0,
) {
  const twiml = new VoiceResponse();
  if (targetIdx >= questions.length) {
    twiml.play(`${UPLOAD_BASE_URL}/uploads/ai_call_audio/closing_global.mp3`);
    twiml.hangup();
    return twiml;
  }
  const q = questions[targetIdx];
  const gather = twiml.gather({
    input: "speech",
    action: `${BASE_URL}/ai-call/webhook/answer/${callId}/${attemptId}/${targetIdx}`,
    method: "POST",
    timeout: 8,
    speechTimeout: "auto",
    language: "en-IN",
  });
  gather.play(`${UPLOAD_BASE_URL}/uploads/ai_call_audio/q_${q.id}.mp3`);
  // No-speech fallback: repeat once, then skip
  if (retryCount < 1) {
    twiml.redirect(
      { method: "POST" },
      `${BASE_URL}/ai-call/webhook/question/${callId}/${attemptId}/${targetIdx}/1`,
    );
  } else {
    twiml.redirect(
      { method: "POST" },
      `${BASE_URL}/ai-call/webhook/question/${callId}/${attemptId}/${targetIdx + 1}/0`,
    );
  }
  return twiml;
}

exports.webhookAnswer = async (req, res) => {
  const { callId, attemptId, questionIndex } = req.params;
  const qIdx = parseInt(questionIndex, 10);
  const spokenAnswer = req.body.SpeechResult || "";

  try {
    // ── Fast repeat check: short response + repeat phrase = repeat request ──
    // Long answers (>8 words) are never repeat requests even if they contain
    // a phrase like "repeat" or "again" naturally in the answer text.
    const normalized = spokenAnswer
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
    const words = normalized.split(/\s+/).filter(Boolean);

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    console.log("normalized =====> ", normalized);
    console.log("wordCount =====> ", wordCount);

    const wantsRepeat =
      // exact single-word match
      (wordCount === 1 && REPEAT_EXACT.includes(words[0])) ||
      // short sentence containing repeat intent
      (wordCount <= 8 &&
        (REPEAT_PHRASES.some((p) => normalized.includes(p)) ||
          words.some((w) => REPEAT_EXACT.includes(w)))); // catches "sorry man", "what bro"

    console.log("wantsRepeat =====> ", wantsRepeat);

    const aiCall = await prisma.aICall.findUnique({ where: { id: callId } });

    let questions = await prisma.aICallQuestion.findMany({
      where: {
        companyId: aiCall.companyId,
        jobId: aiCall.jobId,
        isActive: true,
      },
      orderBy: { order: "asc" },
    });
    if (questions.length === 0) {
      questions = await prisma.aICallQuestion.findMany({
        where: { companyId: aiCall.companyId, jobId: null, isActive: true },
        orderBy: { order: "asc" },
      });
    }

    // ── Repeat: replay same question directly — no redirect round-trip ──────
    if (wantsRepeat) {
      return res
        .type("text/xml")
        .send(
          buildQuestionTwiml(questions, qIdx, callId, attemptId).toString(),
        );
    }

    // ── Save answer and serve next question directly ─────────────────────────
    const currentQ = questions[qIdx];
    const existingTranscript = Array.isArray(aiCall.transcript)
      ? aiCall.transcript
      : [];

    await prisma.aICall.update({
      where: { id: callId },
      data: {
        transcript: [
          ...existingTranscript,
          {
            questionIndex: qIdx,
            question: currentQ.question,
            answer: spokenAnswer,
            confidence: req.body.Confidence || null,
          },
        ],
      },
    });

    // Serve next question directly — no redirect round-trip needed
    res
      .type("text/xml")
      .send(
        buildQuestionTwiml(questions, qIdx + 1, callId, attemptId).toString(),
      );
  } catch (err) {
    console.error("❌ Answer webhook error:", err);
    const twiml = new VoiceResponse();
    twiml.hangup();
    res.type("text/xml").send(twiml.toString());
  }
};

// ─── 4. STATUS CALLBACK — call ended ─────────────────────────────────────────
exports.webhookComplete = async (req, res) => {
  const { callId, attemptId } = req.params;
  const callStatus = req.body.CallStatus; // completed, failed, no-answer, busy
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

    // ── Call was not answered ──────────────────────────────────────────────────
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
      return res.sendStatus(200);
    }

    // ── Technical failure ─────────────────────────────────────────────────────
    if (callStatus === "failed") {
      await prisma.aICallAttempt.update({
        where: { id: attemptId },
        data: { status: "FAILED", duration, failReason: "Twilio call failed" },
      });
      await scheduleNextAttempt(callId, aiCall.attemptNumber);
      return res.sendStatus(200);
    }

    // ── Call completed — determine if intern actually attended ─────────────────
    if (callStatus === "completed") {
      const transcript = Array.isArray(aiCall.transcript)
        ? aiCall.transcript
        : [];

      // If duration is very short or no transcript entries → intern dropped early
      const didAttend = transcript.length > 0 && duration > 15;

      if (!didAttend) {
        await prisma.aICallAttempt.update({
          where: { id: attemptId },
          data: { status: "ANSWERED_DROPPED", duration },
        });
        await scheduleNextAttempt(callId, aiCall.attemptNumber);
        return res.sendStatus(200);
      }

      // Intern completed the interview — score it
      let callScore = null;
      let callSummary = null;
      console.log("answer before refine ===================> ", transcript);

      const correctedAnswers = await correctCallAnswers(transcript);
      console.log(
        "answer after refine ===================> ",
        correctedAnswers,
      );
      try {
        const result = await scoreCallAnswers(
          aiCall.company.companyName,
          aiCall.job.jobTitle,
          correctedAnswers,
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
          transcript: correctedAnswers,
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
      console.log("transcript", transcript);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Complete webhook error:", err);
    res.sendStatus(200); // always 200 to Twilio or it will retry
  }
};
