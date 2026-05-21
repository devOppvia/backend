const { errorResponse, successResponse } = require("../../utils/responseHeader");
const prisma = require("../../config/database");
const aiInterviewService = require("../../services/AIInterview/aiInterview.service");
const internSubscriptionService = require("../../services/InternSubscription/internSubscription.service");
const geminiService = require("../../services/AIInterview/geminiService");
const elevenLabsService = require("../../services/AIInterview/elevenLabsService");
const { generateInterviewPDF } = require("../../utils/pdfGenerator");
const { extractContentFromUrl } = require("../../helpers/urlContentExtractor");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUESTION_ROTATION = [
  "BEHAVIORAL", "TECHNICAL", "SITUATIONAL",
  "BEHAVIORAL", "TECHNICAL", "CLOSING",
];

const getQuestionCount = (durationMins) => {
  if (durationMins == 15) return 4;
  if (durationMins == 30) return 18;
  if (durationMins == 45) return 26;
  if (durationMins == 60) return 42;
  return 5  ;
};

const getQuestionType = (questionNumber, interviewCategory) => {
  if (interviewCategory !== "MIXED") return interviewCategory;
  return QUESTION_ROTATION[(questionNumber - 1) % QUESTION_ROTATION.length] || "BEHAVIORAL";
};

const getTopSkill = (questions) => {
  const counts = {};
  questions.forEach((q) => {
    if (q.skillTested) counts[q.skillTested] = (counts[q.skillTested] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
};

// ─── POST /ai-interview/extract-url ──────────────────────────────────────────
exports.extractUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return errorResponse(res, "URL is required", 400);

    const result = await extractContentFromUrl(url);
    if (!result.success) return errorResponse(res, result.error || "Failed to extract content", 422);

    return successResponse(
      res,
      { content: result.content, title: result.title },
      "Content extracted successfully",
      200,
    );
  } catch (error) {
    console.error("Extract URL error:", error);
    return errorResponse(res, "Failed to extract content from URL", 500);
  }
};

// ─── POST /ai-interview/create ────────────────────────────────────────────────
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

    let websiteContent
    if(companyWebsite) {
       websiteContent = await extractContentFromUrl(companyWebsite)
    }

    console.log(
      "company website extracted text is : ",
      websiteContent?.content,
    );
    // console.log("Type of : " ,typeof(websiteContent))

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
        companyWebsiteText: websiteContent?.content || "",
      },
    });

    return successResponse(res, { interviewId: interview.id }, "Interview created successfully", 200);
  } catch (error) {
    console.error("Create interview error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview/:id/start ─────────────────────────────────────────────
exports.startInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "SETUP")
      return errorResponse(res, "Interview already started or completed", 400);

    const subscription = await internSubscriptionService.getActiveSubscription(internId);
    if (!subscription) return errorResponse(res, "No active subscription", 403);
    if (subscription.interviewCreditsRemaining <= 0)
      return errorResponse(res, "No interview credits remaining", 403);

    await internSubscriptionService.decrementCredit(subscription.id);

    await prisma.aIInterview.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
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

// ─── GET /ai-interview/:id/next-question ──────────────────────────────────────
exports.getNextQuestion = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview not in progress", 400);

    const existingQuestions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: id },
      orderBy: { questionNumber: "asc" },
    });

    const unansweredQuestion = existingQuestions.find((q) => !q.answeredAt);
    if (unansweredQuestion) {
      return successResponse(
        res,
        {
          isComplete: false,
          questionId: unansweredQuestion.id,
          questionNumber: unansweredQuestion.questionNumber,
          questionText: unansweredQuestion.questionText,
          questionType: unansweredQuestion.questionType,
          totalQuestions: interview.totalQuestions,
          skillTested: unansweredQuestion.skillTested,
        },
        "Question resumed",
        200,
      );
    }

    const questionNumber = existingQuestions.length + 1;

    if (questionNumber > interview.totalQuestions) {
      return successResponse(res, { isComplete: true }, "All questions completed", 200);
    }

    const elapsedMins = (Date.now() - new Date(interview.startedAt)) / 60000;
    if (elapsedMins >= interview.duration) {
      return successResponse(res, { isComplete: true }, "Time limit reached", 200);
    }

    const questionType = getQuestionType(questionNumber, interview.interviewCategory);

    const previousQuestions = existingQuestions.map((q) => ({
      question: q.questionText,
      answer: q.answerText,
      score: q.answerScore,
      questionType: q.questionType,
    }));

    const questionResult = await geminiService.generateQuestionForType({
      interview,
      questionNumber,
      totalQuestions: interview.totalQuestions,
      questionType,
      previousQuestions,
    });

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

// ─── POST /ai-interview/:id/tts ───────────────────────────────────────────────
// Streams ElevenLabs audio directly to the client as audio/mpeg.
// Simultaneously writes to disk so repeat requests are served from cache.
exports.textToSpeech = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;
    const { text, questionNumber, voice } = req.body;

    if (!text) return errorResponse(res, "Text is required", 400);
    if (!questionNumber) return errorResponse(res, "questionNumber is required", 400);

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    await elevenLabsService.textToSpeech({
      text,
      interviewId: id,
      questionNumber,
      voicePreference: voice || interview.voiceUsed,
      res,
    });
    // Response is handled inside elevenLabsService (streaming)
  } catch (error) {
    console.error("TTS error:", error);
    // Only send error if headers not yet sent
    if (!res.headersSent) {
      return errorResponse(res, "Failed to convert text to speech", 500);
    }
  }
};

// ─── GET /ai-interview/:id/audio/:questionNumber ──────────────────────────────
// Serves cached audio for repeat/replay. Returns 404 if not cached yet.
exports.replayAudio = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id, questionNumber } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    const served = elevenLabsService.serveCachedAudio({ interviewId: id, questionNumber, res });
    if (!served) return errorResponse(res, "Audio not cached yet", 404);
    // Response is handled inside elevenLabsService (stream)
  } catch (error) {
    console.error("Replay audio error:", error);
    if (!res.headersSent) {
      return errorResponse(res, "Internal server error", 500);
    }
  }
};

// ─── POST /ai-interview/:id/stt ───────────────────────────────────────────────
exports.speechToText = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    if (!req.file) return errorResponse(res, "Audio file is required", 400);

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    const result = await elevenLabsService.speechToText({
      audioBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    return successResponse(
      res,
      { transcript: result.transcript, language: result.language },
      "Speech converted to text",
      200,
    );
  } catch (error) {
    console.error("STT error:", error);
    return errorResponse(res, "Failed to convert speech to text", 500);
  }
};

// ─── POST /ai-interview/:id/answer ────────────────────────────────────────────
exports.submitAnswer = async (req, res) => {
  try {
    console.log("this is function is called : ")
    const internId = req.user.id;
    const { id } = req.params;
    const { questionId, transcript, emotionData } = req.body;
   console.log(" questionId : ", questionId);
      console.log(" transcript : ", transcript);
         console.log(" emotionData : ", emotionData);

    if (!questionId || !transcript) {
      console.log("questionId and transcript are required");
      return errorResponse(res, "questionId and transcript are required", 400);
    }
    console.log("log 2 : check function")

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    console.log("log 3 : check function");

    const question = await prisma.aIInterviewQuestion.findFirst({
      where: { id: questionId, aiInterviewId: id },
    });
    if (!question) return errorResponse(res, "Question not found", 404);
    console.log("log 4 : check function");

    await prisma.aIInterviewQuestion.update({
      where: { id: questionId },
      data: { answerText: transcript, answeredAt: new Date() },
    });

    if (emotionData && Array.isArray(emotionData)) {
      await prisma.aIInterviewExpression.createMany({
        data: emotionData.map((e) => ({
          aiInterviewId: id,
          questionId,
          emotion: e.emotion,
          confidenceScore: e.confidenceScore,
          timestamp: new Date(e.timestamp),
        })),
      });
    }
    console.log("log 5: check function");

    const previousQuestions = await prisma.aIInterviewQuestion.findMany({
      where: { aiInterviewId: id, questionNumber: { lt: question.questionNumber } },
      orderBy: { questionNumber: "asc" },
    });

    const history = previousQuestions.map((q) => ({
      question: q.questionText,
      answer: q.answerText,
      score: q.answerScore,
    }));
        console.log("log 6 : check function");


    const scoreResult = await geminiService.scoreWithGemini({
      question: question.questionText,
      answer: transcript,
      category: interview.interviewCategory,
      history,
    });

        console.log("log 7 : check function");


    await prisma.aIInterviewQuestion.update({
      where: { id: questionId },
      data: {
        answerScore: scoreResult.score,
        starUsed: scoreResult.starUsed,
        skillTested: scoreResult.skillTested,
        aiFeedback: scoreResult.feedback,
      },
    });

        console.log("log 8: check function");


    const isComplete = question.questionNumber >= interview.totalQuestions;

        console.log("log 9 : check function");

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
    console.log("Submit answer error:", error);
    return errorResponse(res, "Failed to process answer", 500);
  }
};

// ─── POST /ai-interview/:id/expression ───────────────────────────────────────
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

// ─── POST /ai-interview/:id/complete ─────────────────────────────────────────
exports.completeInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;
    const { status } = req.body


    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);



    if (status && status == "ABANDONED") {

      await prisma.aIInterview.update({
        where: { id },
        data: {
          status: status,
          completedAt : new Date(),
        },
      });

        return successResponse(
          res,
          {
            
          },
          "Interview completed",
          200,
        );
    }

    const [questions, expressions] = await Promise.all([
      prisma.aIInterviewQuestion.findMany({
        where: { aiInterviewId: id },
        orderBy: { questionNumber: "asc" },
      }),
      prisma.aIInterviewExpression.findMany({ where: { aiInterviewId: id } }),
    ]);

    // Score calculations
    const scores = questions.map((q) => q.answerScore).filter((s) => s != null);
    const overallScore = scores.length
      ? parseFloat(((scores.reduce((a, b) => a + b, 0) / scores.length) * 10).toFixed(2))
      : 0;
    const starUsed = questions.filter((q) => q.starUsed).length;
    const topSkill = getTopSkill(questions);

    // Behavior analysis
    const emotionCounts = { CONFIDENT: 0, NERVOUS: 0, NEUTRAL: 0, HAPPY: 0, CONFUSED: 0 };
    let totalConfidence = 0;
    expressions.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      totalConfidence += e.confidenceScore;
    });
    const total = expressions.length || 1;
    const confidenceScore = parseFloat((totalConfidence / total).toFixed(2));
    const dominantEmotion =
      Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "NEUTRAL";
    const behaviorSummary = {
      confident: Math.round((emotionCounts.CONFIDENT / total) * 100),
      nervous: Math.round((emotionCounts.NERVOUS / total) * 100),
      neutral: Math.round((emotionCounts.NEUTRAL / total) * 100),
      happy: Math.round((emotionCounts.HAPPY / total) * 100),
      confused: Math.round((emotionCounts.CONFUSED / total) * 100),
    };

    // AI insights
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
    const durationActual = Math.round(
      (completedAt - new Date(interview.startedAt || Date.now())) / 60000,
    );

    await prisma.aIInterview.update({
      where: { id },
      data: {
        status: "COMPLETED",
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

    // PDF generation
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
      await prisma.aIInterview.update({ where: { id }, data: { reportPdfPath: pdfUrl } });
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
    }

    // Clean up cached TTS audio files for this interview
    elevenLabsService.clearInterviewAudioCache(id);

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
