const { errorResponse, successResponse } = require("../../utils/responseHeader");
const prisma = require("../../config/database");
const aiInterviewService = require("../../services/AIInterview/aiInterview.service");
const internSubscriptionService = require("../../services/InternSubscription/internSubscription.service");
const geminiService = require("../../services/AIInterview/geminiService");
const xaiService = require("../../services/AIInterview/xaiService");
const { generateInterviewPDF } = require("../../utils/pdfGenerator");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Question rotation for MIXED mode
const QUESTION_ROTATION = ['BEHAVIORAL', 'TECHNICAL', 'SITUATIONAL', 'BEHAVIORAL', 'TECHNICAL', 'CLOSING'];

const getQuestionCount = (durationMins) => {
  if (durationMins == 15) return 6;
  if (durationMins == 30) return 10;
  if (durationMins == 45) return 14;
  if (durationMins == 60) return 18;
  return 6;
};

const getQuestionType = (questionNumber, interviewCategory) => {
  if (interviewCategory !== 'MIXED') return interviewCategory;
  return QUESTION_ROTATION[(questionNumber - 1) % QUESTION_ROTATION.length] || 'BEHAVIORAL';
};

// ─── POST /ai-interview-v2/create ───────────────────────────────────────────
exports.createInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const {
      type,
      interviewerPreference,
      interviewCategory,
      identityVerification,
      duration,
      jobDescription,
      companyWebsite,
      additionalContext,
      resumeSnapshot,
    } = req.body || {};

    if (!type) return errorResponse(res, "Interview type is required", 400);
    if (!["COMPANY", "PRACTICE"].includes(type))
      return errorResponse(res, "Invalid interview type", 400);
    if (!duration) return errorResponse(res, "Duration is required", 400);
    if (!resumeSnapshot) return errorResponse(res, "Resume snapshot is required", 400);
    if (!interviewCategory) return errorResponse(res, "Interview category is required", 400);
    if (type === "COMPANY" && !jobDescription)
      return errorResponse(res, "Job description is required for COMPANY interviews", 400);

    const interview = await prisma.aIInterview.create({
      data: {
        internId,
        type,
        interviewerPreference: interviewerPreference || "MALE",
        interviewCategory: interviewCategory || "MIXED",
        identityVerification: identityVerification || false,
        duration,
        jobDescription: jobDescription || null,
        companyWebsite: companyWebsite || null,
        additionalContext: additionalContext || null,
        resumeSnapshot,
        status: "SETUP",
        voiceUsed: interviewerPreference === "FEMALE" ? "eve" : "rex",
        totalQuestions: getQuestionCount(duration),
      },
    });

    return successResponse(res, { interviewId: interview.id }, "Interview created successfully", 200);
  } catch (error) {
    console.error("Create interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview-v2/:id/start ──────────────────────────────────────────
exports.startInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "SETUP")
      return errorResponse(res, "Interview already started or completed", 400);

    // Check subscription
    const subscription = await internSubscriptionService.getActiveSubscription(internId);
    if (!subscription) return errorResponse(res, "No active subscription", 403);
    if (subscription.interviewCreditsRemaining <= 0)
      return errorResponse(res, "No interview credits remaining", 403);

    // Deduct credit
    await internSubscriptionService.decrementCredit(subscription.id);

    await prisma.aIInterview.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return successResponse(
      res,
      {
        interviewId: id,
        totalQuestions: interview.totalQuestions,
        interviewCategory: interview.interviewCategory,
        voice: interview.voiceUsed,
      },
      "Interview started",
      200,
    );
  } catch (error) {
    console.error("Start interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview-v2/:id/next-question ───────────────────────────────────
exports.getNextQuestion = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview not in progress", 400);

    // Count existing questions
    const existingQuestions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: id },
      orderBy: { questionNumber: 'asc' },
    });

    const questionNumber = existingQuestions.length + 1;

    // Check if interview should end
    if (questionNumber > interview.totalQuestions) {
      return successResponse(
        res,
        { isComplete: true, message: "All questions completed" },
        "Interview questions complete",
        200,
      );
    }

    // Check time limit
    const elapsedMins = (Date.now() - new Date(interview.startedAt)) / 60000;
    if (elapsedMins >= interview.duration) {
      return successResponse(
        res,
        { isComplete: true, message: "Time limit reached" },
        "Interview time complete",
        200,
      );
    }

    // Get question type based on rotation
    const questionType = getQuestionType(questionNumber, interview.interviewCategory);

    // Get previous questions for context
    const previousQuestions = existingQuestions.map(q => ({
      question: q.questionText,
      answer: q.answerText,
      score: q.answerScore,
      questionType: q.questionType,
    }));

    // Generate question with Gemini
    const questionResult = await geminiService.generateQuestionForType({
      interview,
      questionNumber,
      totalQuestions: interview.totalQuestions,
      questionType,
      previousQuestions,
    });

    // Store question
    const createdQuestion = await prisma.aIInterviewQuestion.create({
      data: {
        aiInterviewId: id,
        questionNumber,
        questionText: questionResult.question,
        questionType: questionResult.questionType,
        skillTested: questionResult.skillTested,
      },
    });

    return successResponse(
      res,
      {
        isComplete: false,
        questionId: createdQuestion.id,
        questionNumber,
        questionText: questionResult.question,
        questionType,
        totalQuestions: interview.totalQuestions,
        skillTested: questionResult.skillTested,
      },
      "Question generated",
      200,
    );
  } catch (error) {
    console.error("Get next question error:", error);
    return errorResponse(res, "Failed to generate question", 500);
  }
};

// ─── POST /ai-interview-v2/:id/tts ────────────────────────────────────────────
exports.textToSpeech = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;
    const { text, voice } = req.body;

    if (!text) return errorResponse(res, "Text is required", 400);

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    const voiceToUse = voice || interview.voiceUsed || "eve";

    // Call xAI TTS API
    const ttsResult = await xaiService.textToSpeech({
      text,
      voice: voiceToUse,
      model: "grok-3-audio",
    });

    // Store audio file and get URL
    const audioUrl = await storeAudioFile(ttsResult.audioBuffer, id);

    return successResponse(
      res,
      {
        audioUrl,
        durationMs: ttsResult.durationMs,
        voice: voiceToUse,
      },
      "Text converted to speech",
      200,
    );
  } catch (error) {
    console.error("TTS error:", error);
    return errorResponse(res, "Failed to convert text to speech", 500);
  }
};

// ─── POST /ai-interview-v2/:id/stt ────────────────────────────────────────────
exports.speechToText = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    // Check if audio file was uploaded
    if (!req.file) return errorResponse(res, "Audio file is required", 400);

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    // Convert audio file to format xAI expects (mp3)
    const audioBuffer = await convertAudioFormat(req.file.buffer, 'mp3');

    // Call xAI STT API
    const sttResult = await xaiService.speechToText({
      audioBuffer,
      model: "grok-3-audio",
      language: "en",
    });

    return successResponse(
      res,
      {
        transcript: sttResult.text,
        confidence: sttResult.confidence,
        language: sttResult.language,
      },
      "Speech converted to text",
      200,
    );
  } catch (error) {
    console.error("STT error:", error);
    return errorResponse(res, "Failed to convert speech to text", 500);
  }
};

// ─── POST /ai-interview-v2/:id/answer ─────────────────────────────────────────
exports.submitAnswer = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;
    const { questionId, transcript, emotionData } = req.body;

    if (!questionId || !transcript) {
      return errorResponse(res, "questionId and transcript are required", 400);
    }

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    // Get the question
    const question = await prisma.aIInterviewQuestion.findFirst({
      where: { id: questionId, aiInterviewId: id },
    });
    if (!question) return errorResponse(res, "Question not found", 404);

    // Store answer
    await prisma.aIInterviewQuestion.update({
      where: { id: questionId },
      data: {
        answerText: transcript,
        answeredAt: new Date(),
      },
    });

    // Store emotion data if provided
    if (emotionData && Array.isArray(emotionData)) {
      for (const emotion of emotionData) {
        await prisma.aIInterviewExpression.create({
          data: {
            aiInterviewId: id,
            questionId: questionId,
            emotion: emotion.emotion,
            confidenceScore: emotion.confidenceScore,
            timestamp: new Date(emotion.timestamp),
          },
        });
      }
    }

    // Get conversation history for scoring context
    const previousQuestions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: id, questionNumber: { lt: question.questionNumber } },
      orderBy: { questionNumber: 'asc' },
    });

    const history = previousQuestions.map(q => ({
      question: q.questionText,
      answer: q.answerText,
      score: q.answerScore,
    }));

    // Score with Gemini
    const scoreResult = await geminiService.scoreWithGemini({
      question: question.questionText,
      answer: transcript,
      category: interview.interviewCategory,
      history,
    });

    // Store score
    await prisma.aIInterviewQuestion.update({
      where: { id: questionId },
      data: {
        answerScore: scoreResult.score,
        starUsed: scoreResult.starUsed,
        skillTested: scoreResult.skillTested,
        aiFeedback: scoreResult.feedback,
      },
    });

    // Check if this was the last question
    const isComplete = question.questionNumber >= interview.totalQuestions;

    return successResponse(
      res,
      {
        score: scoreResult.score,
        feedback: scoreResult.feedback,
        starUsed: scoreResult.starUsed,
        skillTested: scoreResult.skillTested,
        isComplete,
      },
      "Answer submitted and scored",
      200,
    );
  } catch (error) {
    console.error("Submit answer error:", error);
    return errorResponse(res, "Failed to process answer", 500);
  }
};

// ─── POST /ai-interview-v2/:id/expression ─────────────────────────────────────
exports.submitExpression = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;
    const { questionId, emotion, confidenceScore, timestamp } = req.body || {};

    if (!emotion) return errorResponse(res, "Emotion is required", 400);
    if (confidenceScore == null) return errorResponse(res, "Confidence score is required", 400);

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview is not in progress", 400);

    const validEmotions = ["CONFIDENT", "NERVOUS", "NEUTRAL", "HAPPY", "CONFUSED"];
    if (!validEmotions.includes(emotion))
      return errorResponse(res, "Invalid emotion value", 400);

    await prisma.aIInterviewExpression.create({
      data: {
        aiInterviewId: id,
        questionId: questionId || null,
        emotion,
        confidenceScore: parseFloat(confidenceScore),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    return successResponse(res, {}, "Expression saved", 200);
  } catch (error) {
    console.error("Save expression error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview-v2/:id/complete ─────────────────────────────────────
exports.completeInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    // Get all questions with answers
    const questions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: id },
      orderBy: { questionNumber: 'asc' },
    });

    // Calculate scores
    const scores = questions.map(q => q.answerScore).filter(s => s != null);
    const overallScore = scores.length
      ? parseFloat(((scores.reduce((a, b) => a + b, 0) / scores.length) * 10).toFixed(2))
      : 0;

    const starUsed = questions.filter(q => q.starUsed).length;

    // Calculate behavior summary from expressions
    const expressions = await prisma.aIInterviewExpression.findMany({
      where: { aiInterviewId: id },
    });

    const emotionCounts = { CONFIDENT: 0, NERVOUS: 0, NEUTRAL: 0, HAPPY: 0, CONFUSED: 0 };
    let totalConfidence = 0;
    expressions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      totalConfidence += e.confidenceScore;
    });

    const total = expressions.length || 1;
    const confidenceScore = parseFloat((totalConfidence / total).toFixed(2));
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'NEUTRAL';

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
        interview: { ...interview, overallScore },
        questions,
        behaviorSummary,
      });
      aiInsights = insightsResult.insights || [];
    } catch (err) {
      console.error('Insights generation failed:', err);
    }

    // Update interview
    const completedAt = new Date();
    const durationActual = Math.round(
      (completedAt - new Date(interview.startedAt || Date.now())) / 60000,
    );

    const topSkill = getTopSkill(questions);

    await prisma.aIInterview.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        overallScore,
        avgAnswerScore: overallScore,
        starUsed,
        topSkill,
        durationActual,
        confidenceScore,
        dominantEmotion,
        behaviorSummary,
        aiInsights,
        completedAt,
      },
    });

    // Generate PDF
    let pdfUrl = null;
    try {
      const intern = await prisma.interns.findUnique({
        where: { id: internId },
        select: { fullName: true },
      });

      const updatedInterview = {
        ...interview,
        overallScore,
        avgAnswerScore: overallScore,
        totalQuestions: questions.length,
        starUsed,
        topSkill,
        durationActual,
        confidenceScore,
        dominantEmotion,
        behaviorSummary,
        aiInsights,
        completedAt,
      };

      pdfUrl = await generateInterviewPDF(updatedInterview, intern, questions, expressions);
      await prisma.aIInterview.update({
        where: { id },
        data: { reportPdfPath: pdfUrl },
      });
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
    }

    return successResponse(
      res,
      {
        overallScore,
        avgAnswerScore: overallScore,
        totalQuestions: questions.length,
        starUsed,
        confidenceScore,
        dominantEmotion,
        behaviorSummary,
        aiInsights,
        pdfUrl,
      },
      "Interview completed",
      200,
    );
  } catch (error) {
    console.error("Complete interview error:", error);
    return errorResponse(res, "Failed to complete interview", 500);
  }
};

// ─── GET /ai-interview-v2/:id/result ─────────────────────────────────────────
exports.getResult = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    if (interview.status !== "COMPLETED") {
      return errorResponse(res, "Interview not completed yet", 400);
    }

    return successResponse(
      res,
      {
        interviewId: id,
        overallScore: interview.overallScore,
        avgAnswerScore: interview.avgAnswerScore,
        totalQuestions: interview.totalQuestions,
        starUsed: interview.starUsed,
        topSkill: interview.topSkill,
        durationActual: interview.durationActual,
        confidenceScore: interview.confidenceScore,
        dominantEmotion: interview.dominantEmotion,
        behaviorSummary: interview.behaviorSummary,
        aiInsights: interview.aiInsights,
        pdfUrl: interview.reportPdfPath,
      },
      "Interview result fetched",
      200,
    );
  } catch (error) {
    console.error("Get result error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview-v2/:id/questions ──────────────────────────────────────
exports.getQuestions = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    const questions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: id },
      orderBy: { questionNumber: 'asc' },
    });

    return successResponse(
      res,
      {
        questions: questions.map(q => ({
          id: q.id,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          questionType: q.questionType,
          skillTested: q.skillTested,
          answerText: q.answerText,
          answerScore: q.answerScore,
          starUsed: q.starUsed,
          aiFeedback: q.aiFeedback,
          answeredAt: q.answeredAt,
        })),
      },
      "Questions fetched",
      200,
    );
  } catch (error) {
    console.error("Get questions error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview-v2/download-pdf/:id ───────────────────────────────────
exports.downloadPdf = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    if (!interview.reportPdfPath) {
      return errorResponse(res, "PDF not available", 404);
    }

    // Return the PDF URL
    return successResponse(
      res,
      { pdfUrl: interview.reportPdfPath },
      "PDF URL fetched",
      200,
    );
  } catch (error) {
    console.error("Download PDF error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// Helper functions
function getTopSkill(questions) {
  const skillCounts = {};
  questions.forEach(q => {
    if (q.skillTested) {
      skillCounts[q.skillTested] = (skillCounts[q.skillTested] || 0) + 1;
    }
  });
  return Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

async function storeAudioFile(audioBuffer, interviewId) {
  // Store to local storage, return URL
  // In production, use S3 or other cloud storage
  const uploadsDir = path.join(process.cwd(), 'uploads', 'audio');
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const fileName = `interview-${interviewId}-${Date.now()}.mp3`;
  const filePath = path.join(uploadsDir, fileName);
  
  fs.writeFileSync(filePath, audioBuffer);
  
  // Return relative URL
  return `/uploads/audio/${fileName}`;
}

async function convertAudioFormat(inputBuffer, targetFormat) {
  // For now, return the buffer as-is assuming it's already in a compatible format
  // In production, use ffmpeg to convert webm/opus to mp3/wav
  return inputBuffer;
}
