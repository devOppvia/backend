const WebSocket = require("ws");
const prisma = require("../config/database");

const STATES = {
  INTRO: "INTRO",
  ASKING_QUESTION: "ASKING_QUESTION",
  WAITING_ANSWER: "WAITING_ANSWER",
  REPEATING_QUESTION: "REPEATING_QUESTION",
  INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
};

const MAX_REPEATS = 2;
const SILENCE_TIMEOUT_MS = 9000;

function isRepeatRequest(text) {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  const repeatPhrases = [
    "repeat",
    "say again",
    "can you repeat",
    "repeat question",
    "what was the question",
    "didn't hear",
    "pardon",
  ];
  return repeatPhrases.some(
    (phrase) =>
      lower === phrase ||
      lower.startsWith(`${phrase} `) ||
      lower.endsWith(` ${phrase}`),
  );
}

function isValidAnswer(text) {
  if (!text) return false;
  const cleaned = text.trim().toLowerCase();
  if (cleaned.length < 5) return false;

  const tooShort = [
    "hello",
    "yes",
    "no",
    "okay",
    "ok",
    "hmm",
    "um",
    "uh",
    "repeat",
    "sorry",
    "what",
    "pardon",
    "hi",
  ];
  return !tooShort.includes(cleaned);
}

exports.startRetellLLMServer = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname !== "/retell-llm" && !pathname.startsWith("/retell-llm/")) {
      return;
    }

    console.log(
      `🔌 [Retell LLM] Upgrade request received from ${request.socket.remoteAddress} path=${request.url}`,
    );

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws, request) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const retellCallIdFromPath = decodeURIComponent(
      pathname.replace(/^\/retell-llm\/?/, ""),
    );

    console.log(
      `🔌 [Retell LLM] New connection retellCallId=${retellCallIdFromPath || "unknown"}`,
    );

    let callId = null;
    let attemptId = null;
    let questions = [];
    let introText = "";
    let lastProcessedUserTurnIndex = -1;
    let silenceTimer = null;
    let silenceRetries = 0;
    let currentResponseId = 0;

    const sendResponse = (content, endCall = false, responseId = currentResponseId) => {
      const payload = {
        response_type: "response",
        response_id: responseId,
        content,
        content_complete: true,
        end_call: endCall,
      };

      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
    };

    const sendConfig = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          response_type: "config",
          config: {
            auto_reconnect: true,
            call_details: true,
          },
        }),
      );
    };

    const clearSilenceTimer = () => {
      if (!silenceTimer) return;
      clearTimeout(silenceTimer);
      silenceTimer = null;
    };

    const resetSilenceTimer = (state) => {
      clearSilenceTimer();
      if (state === STATES.WAITING_ANSWER) {
        silenceTimer = setTimeout(() => {
          handleSilence().catch((err) =>
            console.error("❌ [Retell LLM] Silence handler failed:", err),
          );
        }, SILENCE_TIMEOUT_MS);
      }
    };

    const completeInterview = async (message) => {
      await prisma.aICall.update({
        where: { id: callId },
        data: {
          conversationState: STATES.INTERVIEW_COMPLETED,
          interviewCompleted: true,
        },
      });
      sendResponse(message, true);
    };

    const askQuestion = async (index, prefix = "") => {
      await prisma.aICall.update({
        where: { id: callId },
        data: {
          currentQuestionIndex: index,
          repeatCount: 0,
          conversationState: STATES.WAITING_ANSWER,
        },
      });
      resetSilenceTimer(STATES.WAITING_ANSWER);
      sendResponse(`${prefix}${questions[index].question}`);
    };

    const handleSilence = async () => {
      if (!callId) return;
      silenceRetries += 1;

      console.log(
        `🔇 [Retell LLM] Silence detected (retry ${silenceRetries}) for callId=${callId}`,
      );

      const aiCall = await prisma.aICall.findUnique({ where: { id: callId } });
      if (!aiCall || aiCall.interviewCompleted) return;

      if (silenceRetries < 2) {
        sendResponse("I didn't catch your response. Could you please answer the question?");
        resetSilenceTimer(STATES.WAITING_ANSWER);
        return;
      }

      const nextIndex = aiCall.currentQuestionIndex + 1;
      silenceRetries = 0;

      if (nextIndex >= questions.length) {
        await completeInterview(
          "Thank you for your time! We will review your responses and get back to you soon. Have a great day!",
        );
        return;
      }

      await askQuestion(nextIndex, "Let's move on. ");
    };

    const loadCallData = async (nextCallId) => {
      const aiCall = await prisma.aICall.findUnique({
        where: { id: nextCallId },
        include: {
          company: { select: { companyName: true, aiCallIntro: true } },
          job: { select: { jobTitle: true } },
        },
      });

      if (!aiCall) throw new Error(`AICall ${nextCallId} not found`);

      const companyName = aiCall.company.companyName;
      const jobTitle = aiCall.job?.jobTitle || "the position";

      introText =
        aiCall.company.aiCallIntro ||
        `Hi! Thank you for your interest in ${companyName}. I'm calling to conduct a quick phone interview for the ${jobTitle} position. I'll ask you a few questions. Please answer them as clearly as you can.`;

      questions = await prisma.aICallQuestion.findMany({
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

      console.log(
        `✅ [Retell LLM] Loaded ${questions.length} questions for call ${nextCallId}`,
      );
    };

    const handleResponseRequired = async (transcript, responseId = 0) => {
      currentResponseId = responseId;
      clearSilenceTimer();

      const aiCall = await prisma.aICall.findUnique({ where: { id: callId } });
      if (!aiCall) {
        ws.close();
        return;
      }

      if (aiCall.interviewCompleted) {
        sendResponse("Thank you! Have a great day!", true);
        return;
      }

      const state = aiCall.conversationState;
      const idx = aiCall.currentQuestionIndex;

      if (state === STATES.INTRO) {
        if (questions.length === 0) {
          await completeInterview(
            `${introText} Unfortunately we have no questions configured right now. Thank you for your time. Goodbye!`,
          );
          return;
        }

        await prisma.aICall.update({
          where: { id: callId },
          data: {
            conversationState: STATES.WAITING_ANSWER,
            currentQuestionIndex: 0,
            repeatCount: 0,
          },
        });
        resetSilenceTimer(STATES.WAITING_ANSWER);
        sendResponse(
          `${introText} Let's start with the first question. ${questions[0].question}`,
        );
        return;
      }

      if (
        state !== STATES.ASKING_QUESTION &&
        state !== STATES.WAITING_ANSWER &&
        state !== STATES.REPEATING_QUESTION
      ) {
        return;
      }

      const userTurns = (transcript || []).filter((turn) => turn.role === "user");
      const latestIndex = userTurns.length - 1;

      if (latestIndex <= lastProcessedUserTurnIndex) {
        resetSilenceTimer(STATES.WAITING_ANSWER);
        return;
      }

      lastProcessedUserTurnIndex = latestIndex;
      const candidateText =
        latestIndex >= 0 ? userTurns[latestIndex].content || "" : "";

      if (isRepeatRequest(candidateText)) {
        if (aiCall.repeatCount >= MAX_REPEATS) {
          const nextIndex = idx + 1;
          silenceRetries = 0;

          if (nextIndex >= questions.length) {
            await completeInterview(
              "Let's move on. Thank you for your time! We will review your responses and get back to you soon. Have a great day!",
            );
            return;
          }

          await askQuestion(nextIndex, "Let's continue to the next question. ");
          return;
        }

        await prisma.aICall.update({
          where: { id: callId },
          data: {
            conversationState: STATES.REPEATING_QUESTION,
            repeatCount: aiCall.repeatCount + 1,
          },
        });
        resetSilenceTimer(STATES.WAITING_ANSWER);
        sendResponse(`Sure! Here's the question again: ${questions[idx].question}`);
        await prisma.aICall.update({
          where: { id: callId },
          data: { conversationState: STATES.WAITING_ANSWER },
        });
        return;
      }

      if (!isValidAnswer(candidateText)) {
        resetSilenceTimer(STATES.WAITING_ANSWER);
        sendResponse(
          `Could you please provide a more complete answer? ${questions[idx].question}`,
        );
        return;
      }

      silenceRetries = 0;
      console.log(
        `✅ [Retell LLM] Answer recorded for q${idx}: "${candidateText.slice(0, 60)}..."`,
      );

      await prisma.aICallAnswer.create({
        data: {
          aiCallId: callId,
          questionId: questions[idx].id,
          answer: candidateText,
        },
      });

      const nextIndex = idx + 1;
      if (nextIndex >= questions.length) {
        await completeInterview(
          "Thank you for your time! We will review your responses and get back to you soon. Have a great day!",
        );
        return;
      }

      await askQuestion(nextIndex, "Got it, thank you. Next question: ");
    };

    ws.on("message", async (raw) => {
      try {
        const event = JSON.parse(raw.toString());

        const interactionType = event.interaction_type || event.event_type;

        if (interactionType === "ping_pong") {
          ws.send(
            JSON.stringify({
              response_type: "ping_pong",
              timestamp: event.timestamp,
            }),
          );
          return;
        }

        if (interactionType === "call_details") {
          callId = event.call?.metadata?.callId;
          attemptId = event.call?.metadata?.attemptId;

          console.log(
            `📞 [Retell LLM] call_details — callId=${callId}, attemptId=${attemptId}`,
          );

          if (!callId) {
            console.error("❌ [Retell LLM] No callId in metadata — closing");
            ws.close();
            return;
          }

          await loadCallData(callId);

          if (attemptId) {
            await prisma.aICallAttempt.update({
              where: { id: attemptId },
              data: { answeredAt: new Date(), status: "IN_PROGRESS" },
            });
          }
          return;
        }

        if (
          interactionType === "response_required" ||
          interactionType === "reminder_required"
        ) {
          await handleResponseRequired(event.transcript || [], event.response_id);
        }
      } catch (err) {
        console.error("❌ [Retell LLM] Error:", err);
      }
    });

    ws.on("close", () => {
      clearSilenceTimer();
      console.log(`❌ [Retell LLM] Connection closed for callId=${callId}`);
    });

    ws.on("error", (err) => {
      clearSilenceTimer();
      console.error(
        `❌ [Retell LLM] WebSocket error for callId=${callId}:`,
        err.message,
      );
    });

    sendConfig();
    sendResponse("", false, 0);
  });
};
