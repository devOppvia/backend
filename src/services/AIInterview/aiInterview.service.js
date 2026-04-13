const prisma = require("../../config/database");

// ─── AI Interview CRUD ───────────────────────────────────────────────────────

exports.createInterview = (data) => {
  return prisma.aIInterview.create({ data });
};

exports.getInterviewById = (id) => {
  return prisma.aIInterview.findUnique({ where: { id } });
};

exports.getInterviewByIdAndIntern = (id, internId) => {
  return prisma.aIInterview.findFirst({ where: { id, internId } });
};

exports.updateInterview = (id, data) => {
  return prisma.aIInterview.update({ where: { id }, data });
};

exports.getInterviewHistory = (internId) => {
  return prisma.aIInterview.findMany({
    where: { internId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      interviewCategory: true,
      duration: true,
      status: true,
      overallScore: true,
      totalQuestions: true,
      topSkill: true,
      durationActual: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });
};

exports.getInterviewStats = async (internId) => {
  const [interviews, activeSubscription] = await Promise.all([
    prisma.aIInterview.findMany({
      where: { internId, status: "COMPLETED" },
      select: {
        overallScore: true,
        durationActual: true,
      },
    }),
    prisma.internSubscription.findFirst({
      where: {
        internId,
        isActive: true,
        subscriptionEnd: { gt: new Date() },
      },
      select: {
        interviewCreditsTotal: true,
        interviewCreditsRemaining: true,
      },
    }),
  ]);

  const interviewsDone = interviews.length;
  let avgScore = 0;
  let avgDuration = 0;
  let successRate = 0;
  let userRating = 0;

  if (interviewsDone > 0) {
    const scores = interviews.map((i) => i.overallScore || 0);
    const durations = interviews.map((i) => i.durationActual || 0);

    avgScore = parseFloat(
      (scores.reduce((a, b) => a + b, 0) / interviewsDone).toFixed(2)
    );
    avgDuration = parseFloat(
      (durations.reduce((a, b) => a + b, 0) / interviewsDone).toFixed(2)
    );

    const successfulInterviews = scores.filter((s) => s >= 70).length;
    successRate = parseFloat(
      ((successfulInterviews / interviewsDone) * 100).toFixed(2)
    );

    // Mapping 0-100 score to 0-5 rating
    userRating = parseFloat((avgScore / 20).toFixed(2));
  }

  return {
    interviewsDone,
    avgScore,
    avgDuration,
    successRate,
    userRating,
    interviewTotalCredit: activeSubscription?.interviewCreditsTotal || 0,
    interviewRemainsCredit: activeSubscription?.interviewCreditsRemaining || 0,
  };
};

// ─── Questions ───────────────────────────────────────────────────────────────

exports.createQuestion = (data) => {
  return prisma.aIInterviewQuestion.create({ data });
};

exports.getQuestionById = (id) => {
  return prisma.aIInterviewQuestion.findUnique({ where: { id } });
};

exports.updateQuestion = (id, data) => {
  return prisma.aIInterviewQuestion.update({ where: { id }, data });
};

exports.getQuestionsByInterview = (aiInterviewId) => {
  return prisma.aIInterviewQuestion.findMany({
    where: { aiInterviewId },
    orderBy: { questionNumber: "asc" },
  });
};

exports.getAnsweredCount = (aiInterviewId) => {
  return prisma.aIInterviewQuestion.count({
    where: { aiInterviewId, answeredAt: { not: null } },
  });
};

// ─── Expressions ─────────────────────────────────────────────────────────────

exports.createExpression = (data) => {
  return prisma.aIInterviewExpression.create({ data });
};

exports.getExpressionsByInterview = (aiInterviewId) => {
  return prisma.aIInterviewExpression.findMany({
    where: { aiInterviewId },
    orderBy: { timestamp: "asc" },
  });
};
