const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const subscriptionServices = require("../../services/Subscription/subscription.service");
const companyServices = require("../../services/CompanyManagement/CompanyManagement.service");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../../config/database");
const validator = require("validator");
const { log } = require("console");
const razorpay = new Razorpay({
  key_id: "rzp_test_RlYjFWZ8v5e15u",
  key_secret: "2tFwzJUpNpjYMVRpyNJKYaUj",
});

const hasPriceValue = (value) =>
  value !== undefined && value !== null && value !== "";

const normalizePrice = (value) => (hasPriceValue(value) ? Number(value) : null);

const getPayableAmount = (subscription) =>
  subscription.discountedPrice ?? subscription.actualPrice ?? 0;

const sortSubscriptionsByPayableAmount = (subscriptions) =>
  subscriptions.sort((a, b) => getPayableAmount(a) - getPayableAmount(b));

const activateCompanySubscription = async (companyId, subscriptionPlan) => {
  let existingActiveSubscription = await prisma.companySubscription.findFirst({
    where: {
      companyId: companyId,
      isActive: true,
    },
  });
  let remainingJobCredits = 0;

  if (existingActiveSubscription) {
    remainingJobCredits = existingActiveSubscription.jobPostingCredits || 0;

    await prisma.companySubscription.update({
      where: {
        id: existingActiveSubscription.id,
      },
      data: {
        isActive: false,
      },
    });
  }

  const subscriptionStart = new Date();
  const subscriptionEnd = new Date(subscriptionStart);
  subscriptionEnd.setDate(
    subscriptionEnd.getDate() + subscriptionPlan.expireDaysPackage
  );

  return await prisma.companySubscription.create({
    data: {
      companyId: companyId,
      subscriptionId: subscriptionPlan.id,
      jobPostingCredits:
        subscriptionPlan.numberOfJobPosting + remainingJobCredits,
      numberOfApplications: subscriptionPlan.numberOfApplications,
      subscriptionStart: subscriptionStart,
      subscriptionEnd: subscriptionEnd,
      jobDaysActive: subscriptionPlan.jobDaysActive,
    },
  });
};

const validateSubscriptionPrices = (actualPrice, discountedPrice, isFree) => {
  const normalizedActualPrice = normalizePrice(actualPrice);
  const normalizedDiscountedPrice = normalizePrice(discountedPrice);
  const isFreePlan =
    isFree === true ||
    (normalizedActualPrice === null && normalizedDiscountedPrice === null);

  if (isFreePlan) {
    return {
      actualPrice: null,
      discountedPrice: null,
      error: null,
    };
  }

  if (
    normalizedActualPrice === null ||
    Number.isNaN(normalizedActualPrice) ||
    normalizedActualPrice <= 0
  ) {
    return { error: "Actual price is required" };
  }

  if (
    normalizedDiscountedPrice !== null &&
    (Number.isNaN(normalizedDiscountedPrice) ||
      normalizedDiscountedPrice <= 0)
  ) {
    return { error: "Discounted price is required" };
  }

  if (
    normalizedDiscountedPrice !== null &&
    normalizedActualPrice <= normalizedDiscountedPrice
  ) {
    return {
      error: "Actual price must be greater than discounted price",
    };
  }

  return {
    actualPrice: normalizedActualPrice,
    discountedPrice: normalizedDiscountedPrice,
    error: null,
  };
};

exports.createSubscriptionPlan = async (req, res) => {
  try {
    let {
      packageName,
      actualPrice,
      discountedPrice,
      numberOfJobPosting,
      numberOfApplications,
      jobDaysActive,
      expireDaysPackage,
      isFree = false,
      isRecommended = false
    } = req.body || {};

    if (!packageName) {
      return errorResponse(res, "Package name is required", 400);
    }
    packageName = packageName.trim()
    if (!/^[A-Za-z\s]+$/.test(packageName)) {
      return errorResponse(
        res,
        "Package name must only characters",
        400
      );
    }
    const validatedPrices = validateSubscriptionPrices(
      actualPrice,
      discountedPrice,
      isFree
    );
    if (validatedPrices.error) {
      return errorResponse(res, validatedPrices.error, 400);
    }
    actualPrice = validatedPrices.actualPrice;
    discountedPrice = validatedPrices.discountedPrice;
    if (!numberOfJobPosting) {
      return errorResponse(res, "Number of job posting is required", 400);
    }
    if (!numberOfApplications) {
      return errorResponse(res, "Number of applications is required", 400);
    }
    if (!jobDaysActive) {
      return errorResponse(res, "Job days active is required", 400);
    }
    if (!expireDaysPackage) {
      return errorResponse(res, "Expire days job is required", 400);
    }
    let existingPackageName = await prisma.subscription.findFirst({
      where: {
        packageName: packageName,
        isDelete: false,
      },
    });
    if (existingPackageName) {
      return errorResponse(res, "Package name already exists", 400);
    }

    let existingPricePlan = await prisma.subscription.findFirst({
      where: {
        actualPrice: actualPrice,
        discountedPrice: discountedPrice,
        isDelete: false,
      },
    });
    if (existingPricePlan) {
      return errorResponse(
        res,
        "A plan with the same actual price and discounted price already exists",
        400
      );
    }

    if(isRecommended){
      await prisma.subscription.updateMany({
        where: {
          isRecommended: true,
        },
        data: {
          isRecommended: false,
        },
      });
    }

    await prisma.subscription.create({
      data: {
        packageName,
        actualPrice,
        discountedPrice,
        numberOfJobPosting,
        numberOfApplications,
        jobDaysActive,
        expireDaysPackage,
        isFree: validatedPrices.actualPrice === null,
        isRecommended
      },
    });
    return successResponse(
      res,
      {},
      "Subscription plan created successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    let existingSubscriptions = await subscriptionServices.getAllSubscription();
    existingSubscriptions = sortSubscriptionsByPayableAmount(
      existingSubscriptions
    );
    return successResponse(
      res,
      existingSubscriptions,
      "Subscriptions fetched successfully",
      200
    );
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getSubscriptionPlanForAdmin = async (req, res) => {
  try {
    let existingSubscriptions = await prisma.subscription.findMany({
      where: {
        isDelete: false,
      },
    });
    existingSubscriptions = sortSubscriptionsByPayableAmount(
      existingSubscriptions
    );
    return successResponse(
      res,
      existingSubscriptions,
      "Subscriptions fetched successfully",
      200
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateSubscriptionPlan = async (req, res) => {
  try {
    let { id } = req.params || {};
    let {
      packageName,
      actualPrice,
      discountedPrice,
      numberOfJobPosting,
      numberOfApplications,
      jobDaysActive,
      expireDaysPackage,
      isFree = false,
      isRecommended = false
    } = req.body || {};
    if (!id) {
      return errorResponse(res, "Subscription id is required", 400);
    }
    if (!packageName) {
      return errorResponse(res, "Package name is required", 400);
    }
    const validatedPrices = validateSubscriptionPrices(
      actualPrice,
      discountedPrice,
      isFree
    );
    if (validatedPrices.error) {
      return errorResponse(res, validatedPrices.error, 400);
    }
    actualPrice = validatedPrices.actualPrice;
    discountedPrice = validatedPrices.discountedPrice;
    if (!numberOfJobPosting) {
      return errorResponse(res, "Number of job posting is required", 400);
    }
    if (!numberOfApplications) {
      return errorResponse(res, "Number of applications is required", 400);
    }
    if (!jobDaysActive) {
      return errorResponse(res, "Job days active is required", 400);
    }
    if (!expireDaysPackage) {
      return errorResponse(res, "Expire days job is required", 400);
    }
    let existingPlan = await prisma.subscription.findUnique({
      where: {
        id: id,
      },
    });
    if (!existingPlan) {
      return errorResponse(res, "Subscription plan not found", 400);
    }
    let existingPackageName = await prisma.subscription.findFirst({
      where: {
        packageName: packageName,
        NOT: {
          id: id,
        },
        isDelete: false,
      },
    });

    if (existingPackageName) {
      return errorResponse(res, "Package name already exists", 400);
    }

    if(isRecommended){
      await prisma.subscription.updateMany({
        where: {
          isRecommended: true,
        },
        data: {
          isRecommended: false,
        },
      });
    }

    await prisma.subscription.update({
      where: {
        id: id,
      },
      data: {
        isRecommended,
        packageName,
        actualPrice,
        discountedPrice,
        numberOfJobPosting,
        numberOfApplications,
        jobDaysActive,
        expireDaysPackage,
        isFree: validatedPrices.actualPrice === null,
      },
    });
    return successResponse(
      res,
      {},
      "Subscription plan updated successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Subscription id is required", 400);
    }
    let existingPlan = await prisma.subscription.findUnique({
      where: {
        id: id,
      },
    });
    console.log("existingPlan",existingPlan)
    if (!existingPlan) {
      return errorResponse(res, "Subscription plan not found", 400);
    }
    if(existingPlan.isRecommended){
      let existingRecommendedPlan = await prisma.subscription.findFirst({
       where:{
        NOT:{
          id:existingPlan.id,
        }
       }
    })
    if(existingRecommendedPlan){
      await prisma.subscription.update({
        where:{
          id:existingRecommendedPlan.id,
        },
        data:{
          isRecommended:true,
        }
      })
    }
  }


    await prisma.subscription.update({
      where: {
        id: id,
      },
      data: {
        isDelete: true,
      },
    });
    return successResponse(
      res,
      {},
      "Subscription plan deleted successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getSubscriptionCreditsByCompany = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    let existingCompany = await companyServices.getCompanyDetailsById(
      companyId
    );
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let pendingCredits =
      await subscriptionServices.getCompanySubscriptionCredits(companyId);

    return successResponse(
      res,
      pendingCredits,
      "Subscription credits fetched successfully",
      200
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCompanySubscriptionAccessStatus = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Company id is invalid", 400);
    }

    const existingCompany = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }

    const subscriptionHistory = await prisma.companySubscription.findFirst({
      where: {
        companyId: companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        isActive: true,
        subscriptionEnd: true,
      },
    });

    const hasSubscriptionHistory = Boolean(subscriptionHistory);
    const hasActiveSubscription =
      Boolean(subscriptionHistory?.isActive) &&
      subscriptionHistory.subscriptionEnd > new Date();

    return successResponse(
      res,
      {
        hasSubscriptionHistory,
        hasActiveSubscription,
        shouldChooseInitialPlan: !hasSubscriptionHistory,
      },
      "Subscription access status fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.proceedToCheckout = async (req, res) => {
  try {
    let { companyId, subsciptionPlanId } = req.body || {};

    if (!companyId) return errorResponse(res, "Company id is required", 400);
    if (!subsciptionPlanId) {
      return errorResponse(res, "Subscription plan id is required", 400);
    }
    let existingPackage = await prisma.subscription.findUnique({
      where: {
        id: subsciptionPlanId,
        isDelete: false,
      },
    });
    if (!existingPackage) {
      return errorResponse(res, "Subscription plan not found", 400);
    }
    if (existingPackage.isFree) {
      return errorResponse(
        res,
        "Free plan does not require payment. Please activate it directly.",
        400
      );
    }
    const payableAmount = getPayableAmount(existingPackage);
    const options = {
      amount: payableAmount * 100,
      currency: "INR",
      receipt: `rcpt${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      companyId,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    let {
      companyId,
      subsciptionPlanId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!companyId) return errorResponse(res, "Company id is required", 400);
    if (!subsciptionPlanId)
      return errorResponse(res, "Subscription plan id is required", 400);
    if (!razorpay_order_id)
      return errorResponse(res, "Razorpay order id is required", 400);
    if (!razorpay_payment_id)
      return errorResponse(res, "Razorpay payment id is required", 400);
    if (!razorpay_signature)
      return errorResponse(res, "Razorpay signature is required", 400);

    let selectedSubscriptionPlan = await prisma.subscription.findUnique({
      where: {
        id: subsciptionPlanId,
      },
    });
    if (!selectedSubscriptionPlan) {
      return errorResponse(res, "Subscription plan not found", 404);
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", "7PbpN2Ws8E6xDovejw5vBp4E")
      .update(body.toString())
      .digest("hex");
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status === "captured") {
      await prisma.paymentHistory.create({
        data: {
          companyId: companyId,
          subscriptionId: subsciptionPlanId,
          amountPaid: getPayableAmount(selectedSubscriptionPlan),
          paymentStatus: payment.status,
          razorpay_order_id: razorpay_order_id,
          razorpay_signature: razorpay_signature,
          razorpay_payment_id: razorpay_payment_id,
        },
      });
      await activateCompanySubscription(companyId, selectedSubscriptionPlan);
      return res.json({ status: "success", payment });
    } else {
      return res.status(400).json({ status: "failed", payment });
    }
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.activateFreeSubscriptionPlan = async (req, res) => {
  try {
    let { companyId, subsciptionPlanId } = req.body || {};

    if (!companyId) return errorResponse(res, "Company id is required", 400);
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Company id is invalid", 400);
    }
    if (!subsciptionPlanId) {
      return errorResponse(res, "Subscription plan id is required", 400);
    }
    if (!validator.isUUID(subsciptionPlanId)) {
      return errorResponse(res, "Subscription plan id is invalid", 400);
    }

    let existingCompany = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }

    let selectedSubscriptionPlan = await prisma.subscription.findFirst({
      where: {
        id: subsciptionPlanId,
        isDelete: false,
      },
    });
    if (!selectedSubscriptionPlan) {
      return errorResponse(res, "Subscription plan not found", 404);
    }
    if (!selectedSubscriptionPlan.isFree) {
      return errorResponse(res, "This subscription plan is not free", 400);
    }

    const usedFreeSubscription = await prisma.companySubscription.findFirst({
      where: {
        companyId: companyId,
        subscription: {
          isFree: true,
        },
      },
      include: {
        subscription: {
          select: {
            packageName: true,
          },
        },
      },
    });

    if (usedFreeSubscription) {
      const isExpired =
        !usedFreeSubscription.isActive ||
        usedFreeSubscription.subscriptionEnd <= new Date();
      return errorResponse(
        res,
        isExpired
          ? "Your free plan has expired and is not available again."
          : "You already have an active free plan.",
        400
      );
    }

    await prisma.paymentHistory.create({
      data: {
        companyId: companyId,
        subscriptionId: subsciptionPlanId,
        amountPaid: 0,
        paymentStatus: "captured",
      },
    });

    const subscription = await activateCompanySubscription(
      companyId,
      selectedSubscriptionPlan
    );

    return successResponse(
      res,
      subscription,
      "Free subscription activated successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getPurchasedSubscriptionPackages = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Company id is invalid", 400);
    }
    let purchasedPackages = await prisma.companySubscription.findMany({
      where: {
        companyId: companyId,
        isActive: true,
      },
      select: {
        id: true,
        companyId: true,
        subscriptionId: true,
        jobPostingCredits: true,
        numberOfApplications: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        subscription : {
          select : {
            packageName : true
          }
        }
      },
    });
    return successResponse(
      res,
      purchasedPackages,
      "Purchased packages fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", {}, 200);
  }
};

exports.getPurchasedSubscriptionPackagesForPostJob = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    let purchasedPackages = await prisma.companySubscription.findMany({
      where: {
        companyId: companyId,
        isActive: true,
      },
      select: {
        id: true,
        companyId: true,
        subscriptionId: true,
        jobPostingCredits: true,
        numberOfApplications: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        jobDaysActive: true,
        subscription: {
          select: {
            packageName: true,
          },
        },
      },
    });
    if (!purchasedPackages.length) {
      let existingJobPosted = await prisma.job.findFirst({
        where: {
          companyId: companyId,
          subscription: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      
      let { createdAt } = existingJobPosted || {};
      
      if (createdAt) {
        const currentDate = new Date();
        const postedDate = new Date(createdAt);
      
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); 
        const postedYear = postedDate.getFullYear();
        const postedMonth = postedDate.getMonth();
      
        if (
          (postedYear === currentYear && postedMonth === currentMonth - 1) ||
          (postedYear === currentYear - 1 && currentMonth === 0 && postedMonth === 11) 
        ) {
          purchasedPackages = [
            {
              id: "",
              companyId: "",
              subscriptionId: "",
              jobPostingCredits: 1,
              numberOfApplications: 10,
              subscriptionStart: "",
              subscriptionEnd: "",
              jobDaysActive: 3,
              subscription: {
                packageName: "Free",
              },
            },
          ];
        }
      }
      return successResponse(
        res,
        purchasedPackages,
        "Purchased packages fetched successfully",
        {},
        200
      );
    }
    return successResponse(
      res,
      purchasedPackages,
      "Purchased packages fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 200);
  }
};

exports.getSubscriptionPackagesForCompany = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Company id is invalid", 400);
    }
    let existingCompany = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let purchasedSubscriptions = await prisma.companySubscription.findMany({
      where: {
        companyId: companyId,
        isActive: true,
      },
    });
    console.log("Purchased subscriptions", purchasedSubscriptions);
    

    let purchasedSubscriptionIds = purchasedSubscriptions.map(
      (subscription) => subscription.subscriptionId
    );
    const usedFreeSubscription = await prisma.companySubscription.findFirst({
      where: {
        companyId: companyId,
        subscription: {
          isFree: true,
        },
      },
    });
    const hasUsedFreePlan = Boolean(usedFreeSubscription);

    let existingSubscriptionPackages = await prisma.subscription.findMany({
      where: {
        isDelete: false,
      },
      select: {
        id: true,
        packageName: true,
        actualPrice: true,
        discountedPrice: true,
        numberOfJobPosting: true,
        numberOfApplications: true,
        jobDaysActive: true,
        expireDaysPackage: true,
        isFree: true,
        isDelete : true
      },
    });
    existingSubscriptionPackages = sortSubscriptionsByPayableAmount(
      existingSubscriptionPackages
    );
    let lowestPrice = null
    if(purchasedSubscriptions.length > 0){
      // const purchasedPrices = existingSubscriptionPackages.filter(pkg => purchasedSubscriptionIds.includes(pkg.id)).map(pkg => pkg.discountedPrice)
      
      // lowestPrice = Math.min(...purchasedPrices)
      const purchasedPrices = existingSubscriptionPackages
      .filter(
        (pkg) =>
          purchasedSubscriptionIds.includes(pkg.id) &&
          pkg.isDelete === false // 👈 ignore deleted
      )
      .map((pkg) => getPayableAmount(pkg));
  
    if (purchasedPrices.length > 0) {
      lowestPrice = Math.min(...purchasedPrices);
    }
    }
    
    
    // existingSubscriptionPackages = existingSubscriptionPackages.map(
    //   (subscription) => {

    //     const isPurchased = purchasedSubscriptionIds.includes(subscription.id);
    //     const isUpgrade = lowestPrice !== null ? subscription.discountedPrice > lowestPrice : false
    //     const isLowerPlan = lowestPrice !== null && subscription.discountedPrice < lowestPrice;
    //     let buttonText = "Buy Now";
    //     let isDisabled = false;
        
        
    //     if (isPurchased) {
    //       buttonText = "Current Plan";
    //       isDisabled = true;
    //     } else if (isUpgrade) {
    //       buttonText = "Upgrade Plan";
    //       isDisabled = false;
    //     } else if (isLowerPlan) {
    //       buttonText = "Lower Plan (Unavailable)";
    //       isDisabled = true;
    //     }
    //     return {
    //       ...subscription,
    //       isPurchased,
    //       isUpgrade,
    //       buttonText,
    //       isDisabled
    //     };
    //   }
    // );
    

    existingSubscriptionPackages = existingSubscriptionPackages.map(
      ({ isDelete, ...subscription }) => {
        const isPurchased = purchasedSubscriptionIds.includes(subscription.id);
        const payableAmount = getPayableAmount(subscription);
        const isUpgrade =
          lowestPrice !== null && payableAmount > lowestPrice;
        const isLowerPlan =
          lowestPrice !== null && payableAmount < lowestPrice;
    
        let buttonText = subscription.isFree ? "Continue With Free Plan" :  "Buy Now";
        let isDisabled = false;
    
        // 🚫 deleted plans (handled internally)
        if (isDelete) {
          buttonText = "Plan Unavailable";
          isDisabled = true;
        }
        else if (subscription.isFree && hasUsedFreePlan && !isPurchased) {
          buttonText = "Free Plan Expired";
          isDisabled = true;
        }
        // ✅ active logic
        else if (isPurchased) {
          buttonText = "Current Plan";
          isDisabled = true;
        } else if (isUpgrade) {
          buttonText = "Upgrade Plan";
          isDisabled = false;
        } else if (isLowerPlan) {
          buttonText = "Lower Plan (Unavailable)";
          isDisabled = true;
        }
    
        return {
          ...subscription,
          isPurchased,
          isUpgrade,
          buttonText,
          isDisabled,
        };
      }
    );
    

    return successResponse(
      res,
      existingSubscriptionPackages,
      "Subscription packages fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    let existingPayments = await prisma.paymentHistory.findMany({
      where: {
        companyId: companyId,
      },
      select: {
        id: true,
        companyId: true,
        subscriptionId: true,
        amountPaid: true,
        paymentStatus: true,
        purchasedAt: true,
        subscription : {
          select : {
            packageName : true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return successResponse(
      res,
      existingPayments,
      "Payment history fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
