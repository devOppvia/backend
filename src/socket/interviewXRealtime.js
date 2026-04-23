const WebSocket = require("ws");
require("dotenv").config();

const prisma = require("../config/database");
const geminiService = require("../services/AIInterview/geminiService");

// Check for XAI_API_KEY
if (!process.env.XAI_API_KEY) {
  console.error("[X AI] ERROR: XAI_API_KEY environment variable is not set!");
  console.error("[X AI] Please set XAI_API_KEY in your .env file");
}

// ─── In-memory store for active interview sessions ──────────────────────────
// Key: interviewId → InterviewXSession
const interviewSessions = new Map();

exports.getInterviewSession = (interviewId) => interviewSessions.get(interviewId);
exports.deleteInterviewSession = (interviewId) => interviewSessions.delete(interviewId);
exports.getAllInterviewSessions = () => new Map(interviewSessions);

// ─── Interview Session Class ─────────────────────────────────────────────────
class InterviewXSession {
  constructor(browserWs, interviewId, internId) {
    this.browserWs = browserWs;        // Browser WebSocket
    this.interviewId = interviewId;
    this.internId = internId;
    this.xaiWs = null;                  // X AI WebSocket
    this.state = 'STARTING';            // STARTING, ACTIVE, SCORING, SCORING_COMPLETE, ENDED
    this.currentQuestion = null;
    this.questionNumber = 0;
    this.totalQuestions = 0;
    this.conversationHistory = [];
    this.audioBuffer = [];
    this.lastAnswerTranscript = null;
    this.interview = null;
    this.startTime = Date.now();
    this.maxDuration = 0;              // in minutes
    this.voice = 'eve';
  }

  async init(interviewData) {
    this.interview = interviewData;
    this.totalQuestions = interviewData.totalQuestions || 8;
    this.maxDuration = interviewData.duration || 15;
    // this.voice = interviewData.interviewerPreference === 'FEMALE' ? 'eve' : 'rex';
    this.voice = 'eve';

    // Load first question from database
    const firstQuestion = await prisma.aIInterviewQuestion.findFirst({
      where: { aiInterviewId: this.interviewId, questionNumber: 1 },
    });
    
    if (firstQuestion) {
      this.currentQuestion = firstQuestion;
      this.questionNumber = 1;
    }
    
    // Connect to X AI
    await this.connectToXAI(firstQuestion?.questionText || '');
  }

  async connectToXAI(firstQuestionText) {
    console.log(`[Interview ${this.interviewId}] Connecting to X AI Realtime...`);
    
    this.xaiWs = new WebSocket('wss://api.x.ai/v1/realtime', {
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
    });

    this.xaiWs.on('open', () => {
      console.log(`[Interview ${this.interviewId}] X AI WebSocket OPEN - waiting for session.created...`);
      // session.update is now sent in response to session.created event
    });

    // ─── X AI → Browser ───────────────────────────────────────────────────
    this.xaiWs.on('message', (msg) => {
      try {
        const event = JSON.parse(msg.toString());
        this.handleXAIMessage(event);
      } catch (err) {
        console.error(`[Interview ${this.interviewId}] Parse error (XAI→Browser):`, err);
      }
    });

    this.xaiWs.on('close', () => {
      console.log(`[Interview ${this.interviewId}] X AI WebSocket CLOSED`);
      this.state = 'ENDED';
      this.cleanup();
    });

    this.xaiWs.on('error', (err) => {
      console.error(`[Interview ${this.interviewId}] X AI WebSocket error:`, err.message);
      this.sendToBrowser({ type: 'error', message: 'AI connection error' });
    });
  }

  handleXAIMessage(event) {
    // Log all events including audio for debugging
    console.log(`[Interview ${this.interviewId}] X AI event: ${event.type}`, JSON.stringify(event).substring(0, 200));

    // Debug: log exact event type before switch
    console.log(`[Interview ${this.interviewId}] About to switch on type: "${event.type}"`);

    switch (event.type) {
      case 'session.created':
        console.log(`[Interview ${this.interviewId}] Session created, voice: ${event.session?.voice}`);
        // Handled same as conversation.created below
        break;

      case 'conversation.created':
        console.log(`[Interview ${this.interviewId}] Conversation created, sending session.update...`);
        // Send session.update to configure the session
        const instructions = this.buildInterviewInstructions(this.currentQuestion?.questionText || '');
        this.xaiWs.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['audio', 'text'],
            instructions: instructions,
            voice: this.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
            input_audio_transcription: {
              model: 'grok-2-mini',
              language: 'en',
            },
          },
        }));
        console.log(`[Interview ${this.interviewId}] Sent session.update after conversation.created`);
        break;

      case 'session.updated':
        console.log(`[Interview ${this.interviewId}] Session updated, sending response.create...`);
        this.state = 'ACTIVE';
        // Start the conversation
        this.xaiWs.send(JSON.stringify({
          type: 'response.create',
          response: { modalities: ['audio', 'text'] }
        }));
        console.log(`[Interview ${this.interviewId}] response.create sent, notifying browser session_ready`);
        this.sendToBrowser({ type: 'session_ready' });
        break;

      case 'response.output_audio.delta':
        // Forward audio to browser
        console.log(`[Interview ${this.interviewId}] Audio delta case matched, delta:`, event.delta ? `length ${event.delta.length}` : 'MISSING/EMPTY');
        if (event.delta) {
          console.log(`[Interview ${this.interviewId}] Forwarding audio chunk to browser, length: ${event.delta.length}`);
          this.sendToBrowser({
            type: 'audio',
            data: event.delta,
          });
        } else {
          console.warn(`[Interview ${this.interviewId}] Audio delta is empty!`);
        }
        break;

      case 'response.output_audio_transcript.delta':
        // Send transcript for UI display
        if (event.delta) {
          this.sendToBrowser({
            type: 'transcript_delta',
            text: event.delta,
          });
        }
        break;

      case 'response.output_audio_transcript.done':
        // X AI finished speaking question
        this.sendToBrowser({ type: 'ai_done_speaking' });
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking
        this.sendToBrowser({ type: 'user_speaking' });
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        this.sendToBrowser({ type: 'user_done_speaking' });
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // Got user's answer transcript
        if (event.transcript) {
          this.handleUserAnswer(event.transcript);
        }
        break;

      case 'response.done':
        // X AI finished responding
        if (this.state === 'SCORING_COMPLETE') {
          this.state = 'ACTIVE';
        }
        break;

      case 'error':
        console.error(`[Interview ${this.interviewId}] X AI Error:`, event);
        this.sendToBrowser({ type: 'error', message: event.error?.message || 'AI error' });
        break;

      default:
        // Log other events
        if (event.type && !event.type.includes('delta')) {
          console.log(`[Interview ${this.interviewId}] Unhandled event: ${event.type}`);
        }
    }
  }

  async handleUserAnswer(transcript) {
    console.log(`[Interview ${this.interviewId}] User answer: "${transcript.substring(0, 50)}..."`);
    
    this.state = 'SCORING';
    this.lastAnswerTranscript = transcript;
    
    this.sendToBrowser({ type: 'scoring_start' });

    try {
      // 1. Store answer in database
      if (this.currentQuestion) {
        await prisma.aIInterviewQuestion.update({
          where: { id: this.currentQuestion.id },
          data: {
            answerText: transcript,
            answeredAt: new Date(),
          },
        });
      }

      // 2. Score with Gemini
      const scoreResult = await geminiService.scoreWithGemini({
        question: this.currentQuestion?.questionText || '',
        answer: transcript,
        category: this.interview?.interviewCategory || 'MIXED',
        history: this.conversationHistory,
      });

      // 3. Update score in database
      if (this.currentQuestion) {
        await prisma.aIInterviewQuestion.update({
          where: { id: this.currentQuestion.id },
          data: {
            answerScore: scoreResult.score,
            starUsed: scoreResult.starUsed,
            skillTested: scoreResult.skillTested,
            aiFeedback: scoreResult.feedback,
          },
        });
      }

      this.sendToBrowser({
        type: 'score_update',
        score: scoreResult.score,
        feedback: scoreResult.feedback,
      });

      // 4. Check if interview should end
      if (this.questionNumber >= this.totalQuestions) {
        await this.endInterview();
        return;
      }

      // Check time limit
      const elapsedMins = (Date.now() - this.startTime) / 60000;
      if (elapsedMins >= this.maxDuration) {
        console.log(`[Interview ${this.interviewId}] Time limit reached`);
        await this.endInterview();
        return;
      }

      // 5. Generate next question with Gemini
      this.questionNumber++;
      const nextQ = await geminiService.generateNextQuestionWithGemini({
        interview: this.interview,
        history: this.conversationHistory,
        questionNumber: this.questionNumber,
        totalQuestions: this.totalQuestions,
      });

      // 6. Store new question
      const newQuestion = await prisma.aIInterviewQuestion.create({
        data: {
          aiInterviewId: this.interviewId,
          questionNumber: this.questionNumber,
          questionText: nextQ.question,
          skillTested: nextQ.skillTested,
        },
      });

      this.currentQuestion = newQuestion;

      // 7. Add to conversation history
      this.conversationHistory.push({
        question: this.currentQuestion.questionText,
        answer: transcript,
        score: scoreResult.score,
      });

      // 8. Send to X AI to speak the next question
      this.state = 'SCORING_COMPLETE';
      this.sendToBrowser({
        type: 'question_update',
        question: nextQ.question,
        questionNumber: this.questionNumber,
        totalQuestions: this.totalQuestions,
      });

      // Send the next question to X AI
      this.xaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'assistant',
          content: [{
            type: 'text',
            text: `Thank you for your answer. Here's the next question: ${nextQ.question}`,
          }],
        },
      }));

      this.xaiWs.send(JSON.stringify({ type: 'response.create' }));

    } catch (err) {
      console.error(`[Interview ${this.interviewId}] Scoring error:`, err);
      this.sendToBrowser({ type: 'error', message: 'Failed to process answer' });
      // Continue anyway
      this.state = 'ACTIVE';
    }
  }

  async endInterview() {
    if (this.state === 'ENDED') return;
    
    console.log(`[Interview ${this.interviewId}] Ending interview...`);
    this.state = 'ENDED';

    // Send goodbye via X AI
    this.xaiWs.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: 'Thank you for completing the interview. We will now generate your results. Goodbye!',
        }],
      },
    }));

    this.xaiWs.send(JSON.stringify({ type: 'response.create' }));

    // Calculate final scores
    const finalResults = await this.calculateFinalResults();

    // Send to browser
    this.sendToBrowser({
      type: 'interview_complete',
      results: finalResults,
    });

    // Close connections after a delay
    setTimeout(() => {
      this.cleanup();
    }, 5000);
  }

  async calculateFinalResults() {
    const questions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: this.interviewId },
    });

    const scores = questions.map((q) => q.answerScore).filter((s) => s != null);
    const overallScore = scores.length
      ? parseFloat(((scores.reduce((a, b) => a + b, 0) / scores.length) * 10).toFixed(2))
      : 0;

    const starUsed = questions.filter((q) => q.starUsed).length;

    // Get behavior summary from expressions
    const expressions = await prisma.aIInterviewExpression.findMany({
      where: { aiInterviewId: this.interviewId },
    });

    const emotionCounts = { CONFIDENT: 0, NERVOUS: 0, NEUTRAL: 0, HAPPY: 0, CONFUSED: 0 };
    let totalConfidence = 0;
    expressions.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      totalConfidence += e.confidenceScore;
    });
    const total = expressions.length || 1;
    const confidenceScore = parseFloat((totalConfidence / total).toFixed(2));
    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'NEUTRAL';

    const behaviorSummary = {
      confident: Math.round((emotionCounts.CONFIDENT / total) * 100),
      nervous: Math.round((emotionCounts.NERVOUS / total) * 100),
      neutral: Math.round((emotionCounts.NEUTRAL / total) * 100),
      happy: Math.round((emotionCounts.HAPPY / total) * 100),
      confused: Math.round((emotionCounts.CONFUSED / total) * 100),
    };

    // Generate insights with Gemini
    let aiInsights = [];
    try {
      const insightsResult = await geminiService.generateInsightsWithGemini({
        interview: { ...this.interview, overallScore },
        questions,
        behaviorSummary,
      });
      aiInsights = insightsResult.insights || [];
    } catch (err) {
      console.error('Insights generation failed:', err);
    }

    // Update interview record
    const completedAt = new Date();
    const durationActual = Math.round((completedAt - new Date(this.interview?.startedAt || Date.now())) / 60000);

    await prisma.aIInterview.update({
      where: { id: this.interviewId },
      data: {
        status: 'COMPLETED',
        totalQuestions: questions.length,
        overallScore,
        avgAnswerScore: overallScore,
        starUsed,
        topSkill: this.getTopSkill(questions),
        durationActual,
        confidenceScore,
        dominantEmotion,
        behaviorSummary,
        aiInsights,
        completedAt,
      },
    });

    return {
      overallScore,
      avgAnswerScore: overallScore,
      totalQuestions: questions.length,
      starUsed,
      confidenceScore,
      dominantEmotion,
      behaviorSummary,
      aiInsights,
    };
  }

  getTopSkill(questions) {
    const skillCounts = {};
    questions.forEach((q) => {
      if (q.skillTested) {
        skillCounts[q.skillTested] = (skillCounts[q.skillTested] || 0) + 1;
      }
    });
    return Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  buildInterviewInstructions(firstQuestionText) {
    const category = this.interview?.interviewCategory || 'MIXED';
    const duration = this.maxDuration;
    const totalQ = this.totalQuestions;
    
    return `You are a professional AI interviewer conducting a ${category} interview. 

The interview will last approximately ${duration} minutes with ${totalQ} questions total.

YOUR ROLE:
- Ask interview questions clearly and professionally
- Listen to the candidate's answers
- Provide a brief acknowledgment before moving to the next question
- Be encouraging but maintain professionalism

INTERVIEW FLOW:
1. Start by introducing yourself: "Hello! I'm your AI interviewer today. Let's begin with the first question."
2. Ask the first question: "${firstQuestionText}"
3. After the candidate answers each question, acknowledge briefly and ask the next question
4. When all questions are complete, thank the candidate and end the conversation

IMPORTANT RULES:
- Ask only ONE question at a time
- Wait for the candidate to finish speaking before responding
- If the candidate asks you to repeat, repeat the same question clearly
- If the candidate says "end interview" or "stop", acknowledge and end gracefully
- Keep responses concise - just acknowledge and move to the next question
- Do NOT provide feedback on answers during the interview
- Do NOT answer questions about the interview process or your nature as an AI

The candidate's resume and job description have been provided to generate relevant questions.`;
  }

  sendToBrowser(data) {
    if (this.browserWs && this.browserWs.readyState === WebSocket.OPEN) {
      this.browserWs.send(JSON.stringify(data));
    }
  }

  handleBrowserAudio(audioData) {
    // Forward browser audio to X AI
    if (this.xaiWs && this.xaiWs.readyState === WebSocket.OPEN) {
      this.xaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioData,
      }));
    }
  }

  handleBrowserMessage(data) {
    const msg = JSON.parse(data);
    
    switch (msg.type) {
      case 'audio':
        // Audio data from browser microphone
        this.handleBrowserAudio(msg.data);
        break;

      case 'end_interview':
        // User requested to end interview
        this.endInterview();
        break;

      case 'ping':
        // Keep connection alive
        this.sendToBrowser({ type: 'pong' });
        break;

      default:
        console.log(`[Interview ${this.interviewId}] Unknown browser message:`, msg.type);
    }
  }

  cleanup() {
    if (this.xaiWs) {
      this.xaiWs.close();
      this.xaiWs = null;
    }
    interviewSessions.delete(this.interviewId);
  }
}

// ─── WebSocket Server ─────────────────────────────────────────────────────────
exports.startInterviewRealtimeServer = (server) => {
  // Use noServer mode to handle upgrade manually for better path control
  const wss = new WebSocket.Server({ noServer: true });

  console.log('🎙️ Interview X AI Realtime WebSocket server initialized at /ws/interview');

  // Handle upgrade manually to check path
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    
    if (pathname === '/ws/interview') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // If not our path, let other handlers process it (or do nothing)
  });

  wss.on('connection', async (browserWs, req) => {
    console.log('🔌 Browser connected to interview WebSocket');
    
    // Parse interviewId from URL query or path
    const url = new URL(req.url, 'http://localhost');
    const interviewId = url.searchParams.get('id');
    
    if (!interviewId) {
      console.error('❌ No interviewId provided');
      browserWs.send(JSON.stringify({ type: 'error', message: 'Interview ID required' }));
      browserWs.close();
      return;
    }

    // Check if interview exists and is in progress
    const interview = await prisma.aIInterview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      console.error(`❌ Interview ${interviewId} not found`);
      browserWs.send(JSON.stringify({ type: 'error', message: 'Interview not found' }));
      browserWs.close();
      return;
    }

    if (interview.status !== 'IN_PROGRESS') {
      console.error(`❌ Interview ${interviewId} is not in progress (status: ${interview.status})`);
      browserWs.send(JSON.stringify({ type: 'error', message: 'Interview not in progress' }));
      browserWs.close();
      return;
    }

    // Check for existing session — reuse it instead of destroying it
    const existingSession = interviewSessions.get(interviewId);
    if (existingSession && existingSession.state !== 'ENDED') {
      console.log(`[Interview ${interviewId}] Reconnecting to existing session (state: ${existingSession.state})`);
      existingSession.browserWs = browserWs;
      // Re-send session_ready so the client re-initialises audio
      existingSession.sendToBrowser({ type: 'session_ready' });
      // If the X AI session is ACTIVE and has already started, re-trigger the question
      if (existingSession.state === 'ACTIVE' && existingSession.xaiWs?.readyState === WebSocket.OPEN) {
        existingSession.xaiWs.send(JSON.stringify({
          type: 'response.create',
          response: { modalities: ['audio', 'text'] }
        }));
      }

      browserWs.on('message', (message) => {
        try { existingSession.handleBrowserMessage(message); } catch (err) {
          console.error(`[Interview ${interviewId}] Browser message error:`, err);
        }
      });
      browserWs.on('close', () => {
        console.log(`🔌 Browser disconnected from interview ${interviewId}`);
        setTimeout(() => {
          const cur = interviewSessions.get(interviewId);
          if (cur && cur.browserWs === browserWs) {
            console.log(`[Interview ${interviewId}] No reconnection, cleaning up`);
            cur.cleanup();
          }
        }, 30000);
      });
      browserWs.on('error', (err) => {
        console.error(`[Interview ${interviewId}] Browser WebSocket error:`, err.message);
      });
      return; // Don't create a new session
    }

    // Cleanup ended/stale session if any
    if (existingSession) existingSession.cleanup();

    // Create new session
    const session = new InterviewXSession(browserWs, interviewId, interview.internId);
    interviewSessions.set(interviewId, session);

    // Initialize session
    await session.init(interview);

    // ─── Browser → Backend/X AI ───────────────────────────────────────────
    browserWs.on('message', (message) => {
      try {
        session.handleBrowserMessage(message);
      } catch (err) {
        console.error(`[Interview ${interviewId}] Browser message error:`, err);
      }
    });

    browserWs.on('close', () => {
      console.log(`🔌 Browser disconnected from interview ${interviewId}`);
      // Don't immediately cleanup - allow for reconnection
      setTimeout(() => {
        // Check if session was reconnected
        const currentSession = interviewSessions.get(interviewId);
        if (currentSession === session) {
          console.log(`[Interview ${interviewId}] No reconnection, cleaning up`);
          session.cleanup();
        }
      }, 30000); // 30 second grace period
    });

    browserWs.on('error', (err) => {
      console.error(`[Interview ${interviewId}] Browser WebSocket error:`, err.message);
    });
  });

  return wss;
};

// ─── Helper to reconnect to existing session ────────────────────────────────
exports.reconnectSession = (interviewId, browserWs) => {
  const session = interviewSessions.get(interviewId);
  if (session && session.state !== 'ENDED') {
    // Update browser WebSocket
    session.browserWs = browserWs;
    session.sendToBrowser({
      type: 'reconnected',
      questionNumber: session.questionNumber,
      totalQuestions: session.totalQuestions,
      currentQuestion: session.currentQuestion?.questionText,
    });
    return true;
  }
  return false;
};
