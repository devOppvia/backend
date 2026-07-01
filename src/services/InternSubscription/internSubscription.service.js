const prisma = require("../../config/database");

// ─── Plans ───────────────────────────────────────────────────────────────────

exports.createPlan = (data) => {
  return prisma.internSubscriptionPlan.create({ data });
};

exports.getActivePlans = () => {
  return prisma.internSubscriptionPlan.findMany({
    where: { isDelete: false },
    orderBy: [{ isFreePlan: "desc" }, { discountedPrice: "asc" }],
  });
};

exports.getAllPlansForAdmin = () => {
  return prisma.internSubscriptionPlan.findMany({
    orderBy: { createdAt: "desc" },
  });
};

exports.countActivePlans = () => {
  return prisma.internSubscriptionPlan.count({
    where: { isDelete: false },
  });
};

exports.countActiveFreePlans = (excludeId) => {
  return prisma.internSubscriptionPlan.count({
    where: {
      isDelete: false,
      isFreePlan: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
};

exports.getPlanById = (id) => {
  return prisma.internSubscriptionPlan.findUnique({ where: { id } });
};

exports.updatePlan = (id, data) => {
  return prisma.internSubscriptionPlan.update({ where: { id }, data });
};

exports.deletePlan = (id) => {
  return prisma.internSubscriptionPlan.delete({ where: { id } });
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

exports.createSubscription = (data) => {
  return prisma.internSubscription.create({ data });
};

exports.getActiveSubscription = (internId) => {
  return prisma.internSubscription.findFirst({
    where: {
      internId,
      isActive: true,
      subscriptionEnd: { gt: new Date() },
    },
    include: { plan: true },
  });
};

exports.deactivateSubscription = (id) => {
  return prisma.internSubscription.update({
    where: { id },
    data: { isActive: false },
  });
};

exports.decrementCredit = (id) => {
  return prisma.internSubscription.update({
    where: { id },
    data: { interviewCreditsRemaining: { decrement: 1 } },
  });
};

exports.addCredits = (id, credits) => {
  return prisma.internSubscription.update({
    where: { id },
    data: {
      interviewCreditsTotal: { increment: credits },
      interviewCreditsRemaining: { increment: credits },
    },
  });
};

exports.hasUsedFreePlan = (internId) => {
  return prisma.internSubscription.findFirst({
    where: {
      internId,
      plan: { isFreePlan: true },
    },
  });
};
