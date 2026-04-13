const prisma = require("../../config/database");

// ─── Plans ───────────────────────────────────────────────────────────────────

exports.createPlan = (data) => {
  return prisma.internSubscriptionPlan.create({ data });
};

exports.getActivePlans = () => {
  return prisma.internSubscriptionPlan.findMany({
    where: { isDelete: false },
    orderBy: { discountedPrice: "asc" },
  });
};

exports.getAllPlansForAdmin = () => {
  return prisma.internSubscriptionPlan.findMany({
    orderBy: { createdAt: "desc" },
  });
};

exports.getPlanById = (id) => {
  return prisma.internSubscriptionPlan.findUnique({ where: { id } });
};

exports.updatePlan = (id, data) => {
  return prisma.internSubscriptionPlan.update({ where: { id }, data });
};

exports.softDeletePlan = (id) => {
  return prisma.internSubscriptionPlan.update({
    where: { id },
    data: { isDelete: true },
  });
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
