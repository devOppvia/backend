const { errorResponse, successResponse } = require("../../utils/responseHeader");
const aiInterviewService = require("../../services/AIInterview/aiInterview.service");
const internSubscriptionService = require("../../services/InternSubscription/internSubscription.service");
const prompts = require("../../services/AIInterview/aiInterviewPrompts");
const { generateInterviewPDF } = require("../../utils/pdfGenerator");
const prisma = require("../../config/database");
const { GoogleGenAI } = require("@google/genai");
const { OpenRouter } = require("@openrouter/sdk");
require("dotenv").config();
const fs = require("fs");
const { execSync } = require("child_process");
  const OpenAI = require("openai");

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const ai = new GoogleGenAI({ });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getQuestionCount = (durationMins) => {
  if (durationMins == 15) return 8;
  if (durationMins == 30) return 12;
  if (durationMins == 45) return 15;
  if (durationMins == 60) return 20;
};




// async function callAI(systemPrompt, userPrompt) {
//   try {
//     const combined = `${systemPrompt}\n\nUser: ${userPrompt}`;

//     const response = await fetch(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "openai/gpt-4o-mini", // 🔥 SWITCH MODEL (important)
//           messages: [
//             {
//               role: "user",
//               content: combined,
//             },
//           ],
//           temperature: 0.3,
//           max_tokens: 500,
//         }),
//       },
//     );

//     const data = await response.json();

//     // ✅ Handle API-level errors FIRST
//     if (data.error) {
//       console.error("❌ OpenRouter API Error:", data.error);
//       throw new Error(data.error.message);
//     }

//     const text = data?.choices?.[0]?.message?.content;

//     // ✅ Fallback check
//     if (!text || text.trim() === "") {
//       console.error(
//         "❌ Empty AI response FULL:",
//         JSON.stringify(data, null, 2),
//       );
//       throw new Error("Empty AI response");
//     }

//     console.log("✅ RAW AI:", text); // debug once

//     // Clean markdown
//     const cleaned = text
//       .replace(/```json\n?/g, "")
//       .replace(/```\n?/g, "")
//       .trim();

//     // Extract JSON safely
//     const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

//     if (!jsonMatch) {
//       console.error("❌ No JSON found:", cleaned);
//       throw new Error("Invalid JSON format from AI");
//     }

//     return JSON.parse(jsonMatch[0]);
//   } catch (error) {
//     console.error("🔥 OpenRouter Error:", error.message);
//     throw error;
//   }
// }

async function callAI(systemPrompt, userPrompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content: systemPrompt, // ✅ separated properly
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // ❌ Handle API errors
    if (!response.ok) {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
      console.error("❌ Empty AI response:", data);
      throw new Error("Empty AI response");
    }

    console.log("✅ RAW AI:", text);

    // 🧹 Clean markdown
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // 🧠 Extract JSON safely
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ No JSON found:", cleaned);
      throw new Error("Invalid JSON format from AI");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}


async function isRepeatRequest(spokenText, questionText) {
  if (!spokenText || spokenText.trim().length === 0) return false;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are classifying a voice response in an interview. " +
          "Reply with exactly one word: REPEAT or ANSWER. " +
          "Reply REPEAT if the person is asking to hear the question again " +
          "(e.g. 'repeat', 'say again', 'what?', 'huh?', 'sorry?', 'I didn't hear', 'pardon', 'could you repeat'). " +
          "Reply ANSWER if the person is actually answering the question, even if briefly.",
      },
      {
        role: "user",
        content: `Interview question: "${questionText}"\nCandidate said: "${spokenText}"\nClassify:`,
      },
    ],
  });

  const verdict = response.choices[0]?.message?.content?.trim().toUpperCase();
  return verdict === "REPEAT";
}

function buildConversationHistory(questions) {
  return questions
    .filter((q) => q.answeredAt)
    .map((q) => `Q${q.questionNumber}: ${q.questionText}\nA: ${q.answerText}`)
    .join("\n\n");
}

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
      return errorResponse(res, "Invalid interview type. Must be COMPANY or PRACTICE", 400);
    if (!duration) return errorResponse(res, "Duration is required", 400);
    if (!resumeSnapshot) return errorResponse(res, "Resume snapshot is required", 400);
    if (type === "COMPANY" && !jobDescription)
      return errorResponse(res, "Job description is required for COMPANY interviews", 400);

    const interview = await aiInterviewService.createInterview({
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
    });

    return successResponse(res, { interviewId: interview.id }, "Interview created successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview/:id/start ────────────────────────────────────────────

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
    const startedAt = new Date();

    // Update interview status
    await aiInterviewService.updateInterview(id, {
      status: "IN_PROGRESS",
      startedAt,
      totalQuestions,
    });

    // Generate Q1
    const interviewWithTotal = { ...interview, totalQuestions };
    const prompt = prompts.buildNextQuestionPrompt(interviewWithTotal, "", 1, totalQuestions);
    const aiResult = await callAI(prompt.system, prompt.user);
    console.log("aiResult ==>", aiResult);
    const q1 = await aiInterviewService.createQuestion({
      aiInterviewId: id,
      questionNumber: 1,
      questionText: aiResult.question,
      skillTested: aiResult.skillTested || null,
    });

    return successResponse(
      res,
      {
        totalQuestions,
        question: {
          id: q1.id,
          questionNumber: q1.questionNumber,
          questionText: q1.questionText,
          questionType: aiResult.questionType,
        },
      },
      "Interview started",
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview/:id/answer ───────────────────────────────────────────

exports.submitAnswer = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;
    const { questionId, answerText } = req.body || {};

    if (!questionId) return errorResponse(res, "Question id is required", 400);
    if (!answerText) return errorResponse(res, "Answer text is required", 400);

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview is not in progress", 400);

    const question = await aiInterviewService.getQuestionById(questionId);
    if (!question || question.aiInterviewId !== id)
      return errorResponse(res, "Question not found", 404);
    if (question.answeredAt)
      return errorResponse(res, "Question already answered", 400);

    // If candidate asked to repeat, return same question without storing
    const wantsRepeat = await isRepeatRequest(answerText, question.questionText);
    if (wantsRepeat) {
      return successResponse(
        res,
        {
          isRepeat: true,
          question: {
            id: question.id,
            questionNumber: question.questionNumber,
            questionText: question.questionText,
          },
        },
        "Please listen to the question again",
        200,
      );
    }

    // Score the answer
    const scoringPrompt = prompts.buildAnswerScoringPrompt(
      question.questionText,
      answerText,
      interview.interviewCategory
    );
    const scoreResult = await callAI(scoringPrompt.system, scoringPrompt.user);

    const answeredAt = new Date();
    await aiInterviewService.updateQuestion(questionId, {
      answerText,
      answerScore: scoreResult.score,
      starUsed: scoreResult.starUsed || false,
      skillTested: scoreResult.skillTested || question.skillTested,
      aiFeedback: scoreResult.feedback,
      answeredAt,
    });

    const answeredCount = question.questionNumber;
    const isLastQuestion = answeredCount >= interview.totalQuestions;

    if (isLastQuestion) {
      return successResponse(res, { isComplete: true }, "Answer submitted. Interview complete.", 200);
    }

    // Generate next question
    const allQuestions = await aiInterviewService.getQuestionsByInterview(id);
    const conversationHistory = buildConversationHistory(
      allQuestions.map((q) =>
        q.id === questionId ? { ...q, answerText, answeredAt } : q
      )
    );

    const nextQNumber = question.questionNumber + 1;
    const nextQPrompt = prompts.buildNextQuestionPrompt(
      interview,
      conversationHistory,
      nextQNumber,
      interview.totalQuestions
    );
    const nextQResult = await callAI(nextQPrompt.system, nextQPrompt.user);

    const nextQuestion = await aiInterviewService.createQuestion({
      aiInterviewId: id,
      questionNumber: nextQNumber,
      questionText: nextQResult.question,
      skillTested: nextQResult.skillTested || null,
    });

    return successResponse(
      res,
      {
        isComplete: false,
        nextQuestion: {
          id: nextQuestion.id,
          questionNumber: nextQuestion.questionNumber,
          questionText: nextQuestion.questionText,
          questionType: nextQResult.questionType,
        },
      },
      "Answer submitted",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview/:id/complete ─────────────────────────────────────────

exports.completeInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview is not in progress", 400);

    const questions = await aiInterviewService.getQuestionsByInterview(id);
    const expressions = await aiInterviewService.getExpressionsByInterview(id);

    // ── Score calculations ─────────────────────────────────────────────────
    const scores = questions.map((q) => q.answerScore).filter((s) => s != null);
    const overallScore = scores.length
      ? parseFloat(((scores.reduce((a, b) => a + b, 0) / scores.length) * 10).toFixed(2))
      : 0;
    const avgAnswerScore = overallScore;
    const starUsed = questions.filter((q) => q.starUsed).length;
    const totalQuestions = questions.length;

    const skillCounts = {};
    questions.forEach((q) => {
      if (q.skillTested) skillCounts[q.skillTested] = (skillCounts[q.skillTested] || 0) + 1;
    });
    const topSkill =
      Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const completedAt = new Date();
    const durationActual = interview.startedAt
      ? Math.round((completedAt - new Date(interview.startedAt)) / 60000)
      : 0;

    // ── Expression analysis ────────────────────────────────────────────────
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

    // ── AI Insights ───────────────────────────────────────────────────────
    const insightsPrompt = prompts.buildInsightsPrompt(
      interview,
      questions,
      behaviorSummary,
      confidenceScore
    );
    const insightsResult = await callAI(insightsPrompt.system, insightsPrompt.user);
    const aiInsights = insightsResult.insights || [];

    // ── Save to DB ────────────────────────────────────────────────────────
    await aiInterviewService.updateInterview(id, {
      status: "COMPLETED",
      totalQuestions,
      overallScore,
      avgAnswerScore,
      starUsed,
      topSkill,
      durationActual,
      confidenceScore,
      dominantEmotion,
      behaviorSummary,
      aiInsights,
      completedAt,
    });

    // ── Generate PDF ──────────────────────────────────────────────────────
    const intern = await prisma.interns.findUnique({
      where: { id: internId },
      select: { fullName: true },
    });

    const updatedInterview = {
      ...interview,
      overallScore,
      avgAnswerScore,
      totalQuestions,
      starUsed,
      topSkill,
      durationActual,
      confidenceScore,
      dominantEmotion,
      behaviorSummary,
      aiInsights,
      completedAt,
    };

    try {
      const pdfUrl = await generateInterviewPDF(updatedInterview, intern, questions, expressions);
      await aiInterviewService.updateInterview(id, { reportPdfPath: pdfUrl });
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
      // Non-fatal — interview is already marked complete
    }

    return successResponse(res, { interviewId: id }, "Interview completed successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview/:id/resume ────────────────────────────────────────────

exports.resumeInterview = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "IN_PROGRESS")
      return errorResponse(res, "Interview is not in progress", 400);

    const questions = await aiInterviewService.getQuestionsByInterview(id);

    // The first unanswered question is the one to resume from
    const currentQuestion = questions.find((q) => !q.answeredAt) || null;

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
        })),
        currentQuestion: currentQuestion
          ? {
              id: currentQuestion.id,
              order: currentQuestion.questionNumber,
              text: currentQuestion.questionText,
              tag: currentQuestion.skillTested || "",
            }
          : null,
      },
      "Interview resumed",
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── POST /ai-interview/:id/expression ───────────────────────────────────────

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
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};


exports.transcribe = async (req, res) => {
  try {
    console.log("transcribe ===========>");
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const inputPath = req.file.path; // webm file
    const outputPath = inputPath + ".wav";

    // 🔥 REAL conversion (not rename)
    execSync(
      `ffmpeg -i ${inputPath} -ar 16000 -ac 1 -c:a pcm_s16le ${outputPath}`,
    );

    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "gpt-4o-mini-transcribe",
    });

    const text = result.text;

    // cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.json({ text });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};