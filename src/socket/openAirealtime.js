const WebSocket = require("ws");
require("dotenv").config();

const prisma = require("../config/database");

// Twilio client for hanging up calls
const twilio = require("twilio");
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// ─── In-memory store for active call sessions ──────────────────────────────
// Key: callId → { transcript[], conversationText }
const callSessions = new Map();

exports.getCallSession = (callId) => callSessions.get(callId);
exports.deleteCallSession = (callId) => callSessions.delete(callId);

exports.startRealtimeServer = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  // Handle upgrade manually for media-stream path
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    
    if (pathname.startsWith('/media-stream')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let other handlers process other paths
  });

  wss.on("connection", (twilioWs, req) => {
    console.log("🔌 Twilio media stream connected");
    console.log(`🔌 [WS] req.url=${req.url}`);

    // ─── Parse callId and attemptId from URL path ──────────────────────────
    // URL format: /media-stream/callId/attemptId
    const pathParts = req.url.split("/").filter(Boolean);
    console.log(`🔌 [WS] pathParts=${JSON.stringify(pathParts)}`);

    let callId, attemptId;
    if (pathParts.length >= 3 && pathParts[0] === "media-stream") {
      callId = pathParts[1];
      attemptId = pathParts[2];
    }

    console.log(`🔌 [WS] Parsed callId=${callId}, attemptId=${attemptId}`);

    if (!callId) {
      console.error(`❌ No callId in WebSocket path — closing. Full URL: ${req.url}`);
      twilioWs.close();
      return;
    }

    // ─── Session state ─────────────────────────────────────────────────────
    let xaiWs = null;
    let isOpen = false;
    let isResponseActive = false; // Track if AI is currently speaking
    let currentTranscript = [];
    let fullConversationText = "";
    let streamSid = null;

    callSessions.set(callId, {
      transcript: currentTranscript,
      conversationText: "",
    });

    // ─── Load call data and build instructions ─────────────────────────────
    const buildSession = async () => {
      const aiCall = await prisma.aICall.findUnique({
        where: { id: callId },
        include: {
          company: { select: { companyName: true, aiCallIntro: true } },
          job: { select: { jobTitle: true } },
        },
      });

      if (!aiCall) throw new Error(`AICall ${callId} not found`);

      // Fetch questions (job-specific first, company fallback)
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

      const companyName = aiCall.company.companyName;
      const jobTitle = aiCall.job?.jobTitle || "the position";
      const introText =
        aiCall.company.aiCallIntro ||
        `Hi, and thank you for your interest in ${companyName}. We'd love to learn more about your experience. I'll ask you a few questions—please answer them as clearly as you can.`;

      const questionList = questions
        .map((q, i) => `${i + 1}. ${q.question}`)
        .join("\n");

      const instructions = `You are a professional phone interviewer for ${companyName}, conducting an interview for a ${jobTitle} position.

CONVERSATION FLOW — follow this EXACTLY:
1. First, say this intro verbatim: "${introText}"
2. Then ask the following questions ONE AT A TIME in order. Wait for the candidate to answer before moving to the next question.
   Questions:
${questionList}
3. After the candidate answers the last question, say: "Thank you for your time! We will review your responses and get back to you soon. Have a great day!" and end the conversation.

IMPORTANT RULES:
- Ask ONLY ONE question at a time. Wait for the answer before asking the next.
- If the candidate asks to repeat a question, repeat it clearly and wait for their answer.
- If the candidate says "what?", "huh?", "sorry?", "repeat", "say again", or anything indicating they didn't hear the question, repeat the SAME question — do NOT move to the next one.
- If the candidate gives a very short or unclear answer, you may briefly acknowledge it and move to the next question. Do NOT re-ask the same question unless they explicitly ask you to repeat.
- Be polite, professional, and encouraging throughout.
- Do NOT add extra questions beyond the list above.
- Do NOT provide feedback or evaluate answers during the interview.
- Keep your responses concise. Do not add unnecessary commentary.`;

      return { instructions, questions };
    };

    // ─── Connect to X AI Realtime ──────────────────────────────────────────
    const connectXAI = async () => {
      console.log(`🔄[Call ${callId}] Building session and connecting to X AI...`);
      try {
        const { instructions, questions } = await buildSession();
        console.log(`✅[Call ${callId}] Session built with ${questions.length} questions`);

        xaiWs = new WebSocket("wss://api.x.ai/v1/realtime", {
          headers: {
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          },
        });

        xaiWs.on("open", () => {
          console.log(`✅[Call ${callId}] X AI Realtime WebSocket OPEN`);
          isOpen = true;

          // Configure session with native PCMU audio format
          const sessionMsg = {
            type: "session.update",
            session: {
              voice: "Eve",
              instructions,
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 800
              },
              audio: {
                input: {
                  format: { type: "audio/pcmu", rate: 8000 }
                },
                output: {
                  format: { type: "audio/pcmu", rate: 8000 }
                }
              },
              input_audio_transcription: {
                model: "grok-2-mini",
                language: "en"
              }
            },
          };
console.log("📤 SENDING THIS SESSION CONFIG:");
console.log(JSON.stringify(sessionMsg, null, 2));

          console.log(`📤[Call ${callId}] Sending session.update to X AI...`);
          xaiWs.send(JSON.stringify(sessionMsg));
        });

        // ─── X AI → Twilio ───────────────────────────────────────────────
        xaiWs.on("message", (msg) => {
          try {
            const event = JSON.parse(msg.toString());



              if (event.type === "session.created") {
                console.log(
                  `🔵 SESSION CREATED | Voice: ${event.session?.voice}`,
                );
              }
              if (event.type === "session.updated") {
                console.log(
                  `🟢 SESSION UPDATED | Applied Voice: ${event.session?.voice}`,
                );
                console.log(
                  "Full accepted session:",
                  JSON.stringify(event.session, null, 2),
                );
              }
              if (event.type === "error") {
                console.error("❌ XAI ERROR:", JSON.stringify(event, null, 2));
              }


            // Track response state
            if (event.type === "response.created") {
              isResponseActive = true;
              console.log(`🎙️[Call ${callId}] AI response STARTED`);
            }
            if (event.type === "response.done") {
              isResponseActive = false;
              console.log(`🎙️[Call ${callId}] AI response COMPLETED`);
            }

            // Handle interruptions - user started speaking while AI is talking
            if (event.type === "input_audio_buffer.speech_started") {
              console.log(`🎙️[Call ${callId}] User speech STARTED (interruption?)`);
              if (isResponseActive && streamSid) {
                console.log(`🛑[Call ${callId}] INTERRUPTING AI - sending clear and cancel`);
                // Clear Twilio buffer
                twilioWs.send(JSON.stringify({
                  event: "clear",
                  streamSid: streamSid
                }));
                // Cancel AI response
                xaiWs.send(JSON.stringify({ type: "response.cancel" }));
                isResponseActive = false;
              }
            }

            // Log other events (except frequent audio deltas)
            if (event.type !== "response.output_audio.delta" && 
                event.type !== "input_audio_buffer.append") {
              console.log(`📞[Call ${callId}] X AI event: ${event.type}`);
            }

            // Forward audio to Twilio (DIRECT - no conversion)
            if (event.type === "response.output_audio.delta" && event.delta) {
              if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
                twilioWs.send(JSON.stringify({
                  event: "media",
                  streamSid: streamSid,
                  media: {
                    payload: event.delta,
                  },
                }));
              }
            }

            // Collect transcript text and check for call end
            if (event.type === "response.output_audio_transcript.delta" && event.delta) {
              fullConversationText += event.delta;
              const session = callSessions.get(callId);
              if (session) session.conversationText = fullConversationText;
              
              // Check if AI said goodbye - hang up the call
              const lowerText = event.delta.toLowerCase();
              if (lowerText.includes("have a great day") || 
                  lowerText.includes("thank you for your time") ||
                  lowerText.includes("goodbye") ||
                  lowerText.includes("we will review your responses")) {
                console.log(`🏁[Call ${callId}] Interview complete detected, hanging up...`);
                
                // Close WebSocket first to stop the stream
                setTimeout(() => {
                  if (twilioWs.readyState === WebSocket.OPEN) {
                    twilioWs.close();
                  }
                  // Hang up the call via Twilio REST API
                  // We need the callSid - get it from the database
                  prisma.aICallAttempt
                    .findFirst({
                      where: { aiCallId: callId },
                      orderBy: { createdAt: "desc" },
                      select: { callSid: true },
                    })
                    .then((attempt) => {
                      if (attempt?.callSid) {
                        console.log(
                          `📞[Call ${callId}] Hanging up Twilio call ${attempt.callSid}`,
                        );
                        return twilioClient
                          .calls(attempt.callSid)
                          .update({ status: "completed" });
                      }
                    })
                    .catch((err) => {
                      console.error(
                        `❌[Call ${callId}] Failed to hang up:`,
                        err.message,
                      );
                    });
                }, 3000); // Wait 3 seconds for audio to finish playing
              }
            }

            // Track user speech transcript
            if (event.type === "conversation.item.input_audio_transcription.completed") {
              const userText = event.transcript || "";
              if (userText.trim()) {
                console.log(`🗣️[Call ${callId}] User said: "${userText}"`);
                fullConversationText += `\nCandidate: ${userText}\n`;
                const session = callSessions.get(callId);
                if (session) session.conversationText = fullConversationText;
                // Server VAD will automatically trigger next response
              }
            }

            // Log conversation items
            if (event.type === "conversation.item.created") {
              console.log(`�[Call ${callId}] Conversation item: ${event.item?.role}`);
            }

            // After session is updated, kick off the conversation
            if (event.type === "session.updated") {
              console.log(`✅[Call ${callId}] Session updated, starting conversation...`);
              xaiWs.send(JSON.stringify({
                type: "response.create",
                response: { modalities: ["audio", "text"] }
              }));
              console.log(
                `🟢 Applied voice is:`,
                event.session?.voice || "still undefined",
              );

            }

            if (event.type === "error") {
              console.error(`❌[Call ${callId}] X AI Error:`, event);
            }
          } catch (err) {
            console.error(`❌[Call ${callId}] Parse error (XAI→Twilio):`, err);
          }
        });

        xaiWs.on("close", () => {
          console.log(`❌[Call ${callId}] X AI WebSocket CLOSED`);
          isOpen = false;
        });

        xaiWs.on("error", (err) => {
          console.error(`❌[Call ${callId}] X AI WebSocket error:`, err.message);
          isOpen = false;
        });
      } catch (err) {
        console.error(`❌[Call ${callId}] Failed to build session:`, err);
        twilioWs.close();
      }
    };

    connectXAI();

    // ─── Twilio → X AI ────────────────────────────────────────────────────
    twilioWs.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.event === "connected") {
          console.log(`📞[Call ${callId}] Twilio stream EVENT: connected`);
        }

        if (data.event === "start") {
          streamSid = data.start?.streamSid;
          console.log(`📞[Call ${callId}] Twilio stream EVENT: start, streamSid=${streamSid}`);
        }

        if (data.event === "stop") {
          console.log(`📞[Call ${callId}] Twilio stream EVENT: stop`);
        }

        // Forward audio from Twilio to X AI (DIRECT - no conversion)
        if (data.event === "media" && data.media?.payload) {
          if (isOpen && xaiWs?.readyState === WebSocket.OPEN) {
            xaiWs.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: data.media.payload,
            }));
          }
        }

        if (data.event === "stop") {
          console.log(`📞 Twilio stream stopped for call ${callId}`);
        }
      } catch (err) {
        console.error("Parse error (Twilio→XAI):", err);
      }
    });

    twilioWs.on("close", () => {
      console.log(`❌[Call ${callId}] Twilio WebSocket CLOSED`);
      if (xaiWs) xaiWs.close();
      isOpen = false;
    });

    twilioWs.on("error", (err) => {
      console.error(`❌[Call ${callId}] Twilio WebSocket error:`, err.message);
    });

    console.log(`✅[Call ${callId}] Twilio WebSocket handlers attached, awaiting messages...`);
  });
};
