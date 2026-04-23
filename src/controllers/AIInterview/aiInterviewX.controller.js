const { errorResponse, successResponse } = require("../../utils/responseHeader");
const prisma = require("../../config/database");
const aiInterviewService = require("../../services/AIInterview/aiInterview.service");
const internSubscriptionService = require("../../services/InternSubscription/internSubscription.service");
const geminiService = require("../../services/AIInterview/geminiService");
const { reconnectSession, getInterviewSession } = require("../../socket/interviewXRealtime");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getQuestionCount = (durationMins) => {
  if (durationMins == 15) return 8;
  if (durationMins == 30) return 12;
  if (durationMins == 45) return 15;
  if (durationMins == 60) return 20;
  return 8; // default
};

const buildWsUrl = (interviewId) => {
  const wsBase = process.env.WS_URL || process.env.BACKEND_PUBLIC_URL?.replace(/^https/, 'wss') || 'ws://localhost:8008';
  return `${wsBase}/ws/interview?id=${interviewId}`;
};

// ─── POST /ai-interview-x/create ──────────────────────────────────────────────
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
      return errorResponse(res, "Invalid interview type. Must be COMPANY or PRACTICE", 400);
    if (!duration) return errorResponse(res, "Duration is required", 400);
    if (!resumeSnapshot) return errorResponse(res, "Resume snapshot is required", 400);
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
      },
    });

    return successResponse(res, { interviewId: interview.id }, "Interview created successfully", 200);
  } catch (error) {
    console.error("Create interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview-x/:id/start ────────────────────────────────────────────
exports.startInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "SETUP")
      return errorResponse(res, "Interview has already started or is completed", 400);

    // Check subscription
    const subscription = await internSubscriptionService.getActiveSubscription(internId);
    if (!subscription) return errorResponse(res, "No active subscription found", 403);
    if (subscription.interviewCreditsRemaining <= 0)
      return errorResponse(res, "No interview credits remaining", 403);

    // Deduct credit
    await internSubscriptionService.decrementCredit(subscription.id);

    const totalQuestions = getQuestionCount(interview.duration);
    
    // Defensive check: ensure totalQuestions is valid
    if (!totalQuestions || totalQuestions <= 0) {
      console.error(`[Interview ${id}] ERROR: Invalid totalQuestions: ${totalQuestions}`);
      return errorResponse(res, "Invalid interview configuration", 500);
    }
    
    const startedAt = new Date();

    // Update interview status
    await aiInterviewService.updateInterview(id, {
      status: "IN_PROGRESS",
      startedAt,
      totalQuestions,
    });

    // Generate ALL questions at once using Gemini
    const interviewWithTotal = { ...interview, totalQuestions };
    console.log(`[Interview ${id}] Generating all ${totalQuestions} questions...`);
    
    let allQuestions = await geminiService.generateAllQuestions({
      interview: interviewWithTotal,
      totalQuestions,
    });
    
    console.log(`[Interview ${id}] Generated ${allQuestions.length} questions`);

    // Defensive check: ensure questions were generated
    if (!allQuestions || allQuestions.length === 0) {
      console.error(`[Interview ${id}] ERROR: No questions generated! Using fallback.`);
      // Fallback: create at least one default question
      allQuestions.push({
        question: "Tell me about yourself and your background.",
        questionType: "OPENING",
        skillTested: "Self Introduction",
      });
    }

    // Store ALL questions in database
    const createdQuestions = [];
    for (let i = 0; i < allQuestions.length; i++) {
      const q = allQuestions[i];
      const created = await prisma.aIInterviewQuestion.create({
        data: {
          aiInterviewId: id,
          questionNumber: i + 1,
          questionText: q.question,
          skillTested: q.skillTested,
        },
      });
      createdQuestions.push({
        ...created,
        questionType: q.questionType,
      });
    }
    
    console.log(`[Interview ${id}] Stored all ${createdQuestions.length} questions in DB`);

    // Defensive check: ensure at least one question exists
    if (createdQuestions.length === 0) {
      console.error(`[Interview ${id}] ERROR: No questions were created!`);
      return errorResponse(res, "Failed to generate interview questions", 500);
    }

    // Build WebSocket URL
    const wsUrl = buildWsUrl(id);

    return successResponse(
      res,
      {
        interviewId: id,
        totalQuestions,
        question: {
          id: createdQuestions[0].id,
          questionNumber: 1,
          questionText: createdQuestions[0].questionText,
          questionType: createdQuestions[0].questionType,
        },
        wsUrl,
      },
      "Interview started",
      200,
    );
  } catch (error) {
    console.error("Start interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview-x/:id/resume ───────────────────────────────────────────
exports.resumeInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview is not in progress", 400);

    const questions = await aiInterviewService.getQuestionsByInterview(id);
    const wsUrl = buildWsUrl(id);

    // Get current question (first unanswered)
    const currentQuestion = questions.find((q) => !q.answeredAt) || questions[questions.length - 1];

    return successResponse(
      res,
      {
        sessionId: id,
        totalQuestions: interview.totalQuestions,
        questions: questions.map((q) => ({
          id: q.id,
          order: q.questionNumber,
          text: q.questionText,
          tag: q.skillTested || "",
          isAnswered: !!q.answeredAt,
          answerScore: q.answerScore,
        })),
        currentQuestion: currentQuestion
          ? {
              id: currentQuestion.id,
              order: currentQuestion.questionNumber,
              text: currentQuestion.questionText,
              tag: currentQuestion.skillTested || "",
            }
          : null,
        wsUrl,
        isReconnection: true,
      },
      "Interview resumed",
      200,
    );
  } catch (error) {
    console.error("Resume interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview-x/:id/complete ─────────────────────────────────────────
exports.completeInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview is not in progress", 400);

    // Get all data for finalization
    const questions = await aiInterviewService.getQuestionsByInterview(id);
    const expressions = await aiInterviewService.getExpressionsByInterview(id);

    // Calculate scores
    const scores = questions.map((q) => q.answerScore).filter((s) => s != null);
    const overallScore = scores.length
      ? parseFloat(((scores.reduce((a, b) => a + b, 0) / scores.length) * 10).toFixed(2))
      : 0;
    const starUsed = questions.filter((q) => q.starUsed).length;

    // Calculate behavior summary
    const emotionCounts = { CONFIDENT: 0, NERVOUS: 0, NEUTRAL: 0, HAPPY: 0, CONFUSED: 0 };
    let totalConfidence = 0;
    expressions.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      totalConfidence += e.confidenceScore;
    });
    const total = expressions.length || 1;
    const confidenceScore = parseFloat((totalConfidence / total).toFixed(2));
    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "NEUTRAL";
    const behaviorSummary = {
      confident: Math.round((emotionCounts.CONFIDENT / total) * 100),
      nervous: Math.round((emotionCounts.NERVOUS / total) * 100),
      neutral: Math.round((emotionCounts.NEUTRAL / total) * 100),
      happy: Math.round((emotionCounts.HAPPY / total) * 100),
      confused: Math.round((emotionCounts.CONFUSED / total) * 100),
    };

    // Get top skill
    const skillCounts = {};
    questions.forEach((q) => {
      if (q.skillTested) skillCounts[q.skillTested] = (skillCounts[q.skillTested] || 0) + 1;
    });
    const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Generate insights
    let aiInsights = [];
    try {
      const insightsResult = await geminiService.generateInsightsWithGemini({
        interview: { ...interview, overallScore },
        questions,
        behaviorSummary,
      });
      aiInsights = insightsResult.insights || [];
    } catch (err) {
      console.error("Insights generation failed:", err);
    }

    const completedAt = new Date();
    const durationActual = interview.startedAt
      ? Math.round((completedAt - new Date(interview.startedAt)) / 60000)
      : 0;

    // Update interview
    await aiInterviewService.updateInterview(id, {
      status: "COMPLETED",
      totalQuestions: questions.length,
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
    });

    return successResponse(
      res,
      {
        interviewId: id,
        overallScore,
        avgAnswerScore: overallScore,
        totalQuestions: questions.length,
        starUsed,
        topSkill,
        confidenceScore,
        dominantEmotion,
        behaviorSummary,
        aiInsights,
      },
      "Interview completed successfully",
      200,
    );
  } catch (error) {
    console.error("Complete interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview-x/:id/status ────────────────────────────────────────────
exports.getInterviewStatus = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    // Get latest question info
    const latestQuestion = await prisma.aIInterviewQuestion.findFirst({
      where: { aiInterviewId: id },
      orderBy: { questionNumber: "desc" },
    });

    const answeredCount = await prisma.aIInterviewQuestion.count({
      where: { aiInterviewId: id, answeredAt: { not: null } },
    });

    return successResponse(
      res,
      {
        interviewId: id,
        status: interview.status,
        questionNumber: latestQuestion?.questionNumber || 0,
        totalQuestions: interview.totalQuestions,
        answeredCount,
        isComplete: answeredCount >= interview.totalQuestions,
      },
      "Interview status fetched",
      200,
    );
  } catch (error) {
    console.error("Get interview status error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview-x/:id/expression ───────────────────────────────────────
exports.saveExpression = async (req, res) => {
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

    await aiInterviewService.createExpression({
      aiInterviewId: id,
      questionId: questionId || null,
      emotion,
      confidenceScore: parseFloat(confidenceScore),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return successResponse(res, {}, "Expression saved", 200);
  } catch (error) {
    console.error("Save expression error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};
