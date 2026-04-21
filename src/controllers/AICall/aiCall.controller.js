const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const { generateAudio } = require("../../helpers/aiCallHelper");
const validator = require("validator");

exports.addQuestion = async (req, res) => {
  try {
    const { companyId, jobId, question, order } = req.body || {};
    if (!companyId || !validator.isUUID(companyId))
      return errorResponse(res, "Valid companyId required", 400);
    if (!question || question.trim().length < 5)
      return errorResponse(res, "Question must be at least 5 characters", 400);

    const newQ = await prisma.aICallQuestion.create({
      data: {
        companyId,
        jobId: jobId || null,
        question: question.trim(),
        order: order || 0,
      },
    });

    generateAudio(newQ.question, `q_${newQ.id}`)
      .then((url) =>
        prisma.aICallQuestion.update({
          where: { id: newQ.id },
          data: { audioUrl: url },
        }),
      )
      .catch((err) => console.error("❌ Audio gen failed:", err));

    return successResponse(res, newQ, "Question added successfully", {}, 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { jobId } = req.query;
    if (!companyId || !validator.isUUID(companyId))
      return errorResponse(res, "Valid companyId required", 400);

    const questions = await prisma.aICallQuestion.findMany({
      where: { companyId, isActive: true, ...(jobId ? { jobId } : {}) },
      orderBy: { order: "asc" },
    });
    return successResponse(res, questions, "Questions fetched", {}, 200);
  } catch (err) {
    console.error(err);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, order, isActive } = req.body || {};
    if (!id || !validator.isUUID(id))
      return errorResponse(res, "Valid question id required", 400);

    const data = {};
    if (question !== undefined) {
      data.question = question.trim();
      data.audioUrl = null;
    }
    if (order !== undefined) data.order = order;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.aICallQuestion.update({ where: { id }, data });

    if (question) {
      generateAudio(updated.question, `q_${updated.id}`)
        .then((url) =>
          prisma.aICallQuestion.update({
            where: { id: updated.id },
            data: { audioUrl: url },
          }),
        )
        .catch((err) => console.error("❌ Audio regen failed:", err));
    }

    return successResponse(res, updated, "Question updated", {}, 200);
  } catch (err) {
    console.error(err);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !validator.isUUID(id))
      return errorResponse(res, "Valid question id required", 400);

    await prisma.aICallQuestion.update({
      where: { id },
      data: { isActive: false },
    });
    return successResponse(res, {}, "Question deleted", {}, 200);
  } catch (err) {
    console.error(err);
    return errorResponse(res, "Internal server error", 500);
  }
};

// GET /ai-call/results/:candidateManagementId — call campaign + all attempt details
exports.getCallResults = async (req, res) => {
  try {
    const { candidateManagementId } = req.params;
    if (!candidateManagementId || !validator.isUUID(candidateManagementId))
      return errorResponse(res, "Valid candidateManagementId required", 400);

    const calls = await prisma.aICall.findMany({
      where: { candidateManagementId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        attemptNumber: true,
        allAttemptsExhausted: true,
        triggerScore: true,
        callScore: true,
        callSummary: true,
        transcript: true,
        nextCallAt: true,
        createdAt: true,
        attempts: {
          orderBy: { attemptNumber: "asc" },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            duration: true,
            scheduledAt: true,
            answeredAt: true,
            failReason: true,
          },
        },
      },
    });

    return successResponse(res, calls, "Call results fetched", {}, 200);
  } catch (err) {
    console.error(err);
    return errorResponse(res, "Internal server error", 500);
  }
};
