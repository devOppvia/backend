const { errorResponse, successResponse } = require("../../utils/responseHeader");
const aiInterviewService = require("../../services/AIInterview/aiInterview.service");

// ─── GET /ai-interview/my/history ────────────────────────────────────────────

exports.getHistory = async (req, res) => {
  try {
    const internId = req.user.id;
    const history = await aiInterviewService.getInterviewHistory(internId);
    return successResponse(res, history, "Interview history fetched", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview/my/stats ───────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const internId = req.user.id;
    const stats = await aiInterviewService.getInterviewStats(internId);
    return successResponse(res, stats, "Stats fetched", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview/:id ────────────────────────────────────────────────────

exports.getInterviewDetail = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    return successResponse(res, interview, "Interview fetched", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview/:id/result ────────────────────────────────────────────

exports.getResult = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);
    if (interview.status !== "COMPLETED")
      return errorResponse(res, "Interview is not completed yet", 400);

    const result = {
      id: interview.id,
      type: interview.type,
      interviewCategory: interview.interviewCategory,
      duration: interview.duration,
      durationActual: interview.durationActual,
      overallScore: interview.overallScore,
      avgAnswerScore: interview.avgAnswerScore,
      totalQuestions: interview.totalQuestions,
      starUsed: interview.starUsed,
      topSkill: interview.topSkill,
      confidenceScore: interview.confidenceScore,
      dominantEmotion: interview.dominantEmotion,
      behaviorSummary: interview.behaviorSummary,
      aiInsights: interview.aiInsights,
      reportPdfPath: interview.reportPdfPath,
      completedAt: interview.completedAt,
    };

    return successResponse(res, result, "Result fetched", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview/:id/questions ─────────────────────────────────────────

exports.getQuestions = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    const questions = await aiInterviewService.getQuestionsByInterview(id);
    return successResponse(res, questions, "Questions fetched", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── GET /ai-interview/:id/expressions ───────────────────────────────────────

exports.getExpressions = async (req, res) => {
  try {
    const internId = req.user.id;
    const { id } = req.params;

    const interview = await aiInterviewService.getInterviewByIdAndIntern(id, internId);
    if (!interview) return errorResponse(res, "Interview not found", 404);

    const expressions = await aiInterviewService.getExpressionsByInterview(id);
    return successResponse(res, expressions, "Expressions fetched", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};
