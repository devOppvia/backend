const prisma = require("../../config/database");

exports.getSubscriptionBasedOnPrice = async (price) => {
  return await prisma.subscription.findFirst({
    where: {
      price: price,
    },
  });
};

exports.getSubscriptionBasedOnPlanName = async (planName) => {
  return await prisma.subscription.findFirst({
    where: {
      planName: planName,
    },
  });
};

exports.getSubscriptionPlanPriceForUpdate = async (id, price) => {
  return await prisma.subscription.findFirst({
    where: {
      price: price,
      id: {
        not: id,
      },
    },
  });
};

exports.getSubscriptionPlanPlanNameForUpdate = async (id, planName) => {
  return await prisma.subscription.findFirst({
    where: {
      planName: {
        equals: planName,
      },
      id: {
        not: id,
      },
    },
  });
};

exports.getSubscriptionPlanBasedOnId = async (id) => {
  return await prisma.subscription.findFirst({
    where: {
      id: id,
    },
  });
};

exports.createSubscription = async (
  planName,
  sortDescription,
  price,
  credits,
  duration,
  features,
  isPopular,
  subscriptionType
) => {
  return await prisma.subscription.create({
    data: {
      planName: planName,
      sortDescription: sortDescription,
      price: price,
      credits : credits,
      duration: duration,
      features: features,
      isPopular : isPopular,
      subscriptionType : subscriptionType
    },
  });
};

exports.getAllSubscription = async () => {
  return await prisma.subscription.findMany({
    where: {
      isDelete: false,
    },
    orderBy: {
      price: "asc",
    },
    select: {
      id: true,
      planName: true,
      sortDescription: true,
      price: true,
      numberOfJobPosting: true,
      numberOfResumeAccess: true,
      duration: true,
      features: true,
      createdAt: true,
    },
  });
};

exports.getAllSubscriptionsForAdmin = async (subscriptionType) => {
  return await prisma.subscription.findMany({
    where: {
      isDelete: false,
      subscriptionType : subscriptionType
    },
    orderBy: {
      price: "asc",
    },
    select: {
      id: true,
      planName: true,
      sortDescription: true,
      price: true,
      credits : true,
      duration: true,
      features: true,
      createdAt: true,
      isPopular : true,
      subscriptionType : true
    },
  });
};

exports.updateSubscription = async (
  id,
  planName,
  sortDescription,
  price,
  credits,
  duration,
  features,
  isPopular,
  subscriptionType
) => {
  return await prisma.subscription.update({
    where: {
      id: id,
    },
    data: {
      planName: planName,
      sortDescription: sortDescription,
      price: price,
      credits : credits,
      duration: duration,
      features: features,
      isPopular : isPopular,
      subscriptionType : subscriptionType
    },
  });
};

exports.deleteSubscription = async (id) => {
  return await prisma.subscription.update({
    where: {
      id: id,
    },
    data: {
      isDelete: true,
      deletedAt: new Date(),
    },
  });
};

exports.getCompanySubscriptionCredits = async (companyId) => {
  return await prisma.companySubscription.findFirst({
    where: {
      companyId: companyId,
      isActive: true,
    },
    select: {
      id: true,
      jobPostingCredits: true,
      resumeAccessCredits: true,
    },
  });
};

exports.updateCompanySubscriptionCredits = async (
  companyId,
  subsciptionPlanId,
  jobPostingCredits,
  resumeAccessCredits,
  id
) => {
  if (id) {
    return await prisma.companySubscription.update({
      where: {
        id: id,
      },
      data: {
        jobPostingCredits: {
          increment: jobPostingCredits,
        },
        resumeAccessCredits: {
          increment: resumeAccessCredits,
        },
        subscriptionId: subsciptionPlanId,
      },
    });
  } else {
    return await prisma.companySubscription.create({
      data: {
        jobPostingCredits: jobPostingCredits,
        resumeAccessCredits: resumeAccessCredits,
        companyId: companyId,
        subscriptionId: subsciptionPlanId,
      },
    });
  }
};

exports.createPaymentHistory = async (
  companyId,
  subscriptionId,
  amountPaid,
  paymentStatus,
  razorpay_order_id,
  razorpay_signature,
  razorpay_payment_id,
  purchasedAt
) => {
  return await prisma.paymentHistory.create({
    data: {
      companyId: companyId,
      subscriptionId: subscriptionId,
      amountPaid : amountPaid,
      paymentStatus : paymentStatus,
      razorpay_order_id : razorpay_order_id,
      razorpay_signature : razorpay_signature,
      razorpay_payment_id : razorpay_payment_id,
      purchasedAt : new Date()
    },
  });
};
