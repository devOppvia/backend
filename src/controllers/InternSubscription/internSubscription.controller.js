const { errorResponse, successResponse } = require("../../utils/responseHeader");
const internSubscriptionService = require("../../services/InternSubscription/internSubscription.service");
const prisma = require("../../config/database");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const INTERVIEW_DURATIONS = ["MIN_15", "MIN_30", "MIN_45", "MIN_60"];
const INTERVIEW_MODES = ["COMPANY", "PRACTICE"];
const IDENTITY_VERIFICATION_OPTIONS = ["ENABLE", "DISABLE"];

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const validateEnumArray = (values, allowedValues, fieldName) => {
  const normalizedValues = normalizeArray(values);
  if (!normalizedValues.length) return `${fieldName} is required`;

  const invalidValue = normalizedValues.find(
    (value) => !allowedValues.includes(value),
  );

  if (invalidValue) return `${fieldName} has invalid value`;
  return null;
};

const normalizePlanPayload = (body = {}, isUpdate = false) => {
  const {
    planName,
    description,
    price,
    discountedPrice,
    isFreePlan,
    isDiscount = false,
    interviewCredits,
    duration,
    features,
    isPopular = false,
    interviewDuration,
    interviewMode,
    interviewType,
    identityVerification,
  } = body;

  const normalizedIsFreePlan =
    isFreePlan === undefined ? undefined : Boolean(isFreePlan);
  const planIsFree = Boolean(normalizedIsFreePlan);
  const normalizedIsDiscount = planIsFree ? false : Boolean(isDiscount);
  const normalizedPrice = price === undefined || price === "" ? undefined : Number(price);
  const normalizedDiscountedPrice =
    discountedPrice === undefined || discountedPrice === ""
      ? undefined
      : Number(discountedPrice);
  const normalizedInterviewCredits =
    interviewCredits === undefined || interviewCredits === ""
      ? undefined
      : Number(interviewCredits);
  const normalizedDuration =
    duration === undefined || duration === "" ? undefined : Number(duration);
  const normalizedInterviewType =
    interviewType === undefined || interviewType === ""
      ? undefined
      : Number(interviewType);

  if (!isUpdate || planName !== undefined) {
    if (!planName?.trim()) return { error: "Plan name is required" };
  }

  if (!isUpdate || price !== undefined) {
    if (
      !Number.isFinite(normalizedPrice) ||
      (planIsFree ? normalizedPrice < 0 : normalizedPrice <= 0)
    ) {
      return { error: "Price is required" };
    }
  }

  if (!planIsFree && normalizedIsDiscount) {
    if (!Number.isFinite(normalizedDiscountedPrice) || normalizedDiscountedPrice <= 0) {
      return { error: "Discounted price is required" };
    }

    if (Number.isFinite(normalizedPrice) && normalizedPrice <= normalizedDiscountedPrice) {
      return { error: "Price must be greater than discounted price" };
    }
  }

  if (!isUpdate || interviewCredits !== undefined) {
    if (!Number.isFinite(normalizedInterviewCredits) || normalizedInterviewCredits <= 0) {
      return { error: "Interview credits is required" };
    }
  }

  if (!isUpdate || duration !== undefined) {
    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      return { error: "Duration is required" };
    }
  }

  if (!isUpdate || features !== undefined) {
    if (!features || (Array.isArray(features) && !features.length)) {
      return { error: "Features is required" };
    }
  }

  if (!isUpdate || interviewDuration !== undefined) {
    const durationError = validateEnumArray(
      interviewDuration,
      INTERVIEW_DURATIONS,
      "Interview duration",
    );
    if (durationError) return { error: durationError };
  }

  if (!isUpdate || interviewMode !== undefined) {
    const modeError = validateEnumArray(
      interviewMode,
      INTERVIEW_MODES,
      "Interview mode",
    );
    if (modeError) return { error: modeError };
  }

  if (!isUpdate || interviewType !== undefined) {
    if (
      !Number.isInteger(normalizedInterviewType) ||
      normalizedInterviewType < 1 ||
      normalizedInterviewType > 9
    ) {
      return { error: "Interview type limit must be between 1 and 9" };
    }
  }

  if (!isUpdate || identityVerification !== undefined) {
    const identityError = validateEnumArray(
      identityVerification,
      IDENTITY_VERIFICATION_OPTIONS,
      "Identity verification",
    );
    if (identityError) return { error: identityError };
  }

  const data = {
    ...(planName !== undefined && { planName: planName.trim() }),
    ...(description !== undefined && { description }),
    ...(isFreePlan !== undefined && { isFreePlan: normalizedIsFreePlan }),
    ...(normalizedPrice !== undefined && {
      price: planIsFree ? 0 : normalizedPrice,
    }),
    ...(normalizedPrice !== undefined && {
      discountedPrice: planIsFree
        ? 0
        : normalizedIsDiscount
        ? normalizedDiscountedPrice
        : normalizedPrice,
    }),
    ...(normalizedIsDiscount !== undefined && { isDiscount: normalizedIsDiscount }),
    ...(normalizedInterviewCredits !== undefined && {
      interviewCredits: normalizedInterviewCredits,
    }),
    ...(normalizedDuration !== undefined && { duration: normalizedDuration }),
    ...(features !== undefined && { features }),
    ...(isPopular !== undefined && { isPopular }),
    ...(interviewDuration !== undefined && {
      interviewDuration: normalizeArray(interviewDuration),
    }),
    ...(interviewMode !== undefined && {
      interviewMode: normalizeArray(interviewMode),
    }),
    ...(normalizedInterviewType !== undefined && {
      interviewType: normalizedInterviewType,
    }),
    ...(identityVerification !== undefined && {
      identityVerification: normalizeArray(identityVerification),
    }),
  };

  return { data };
};

// ─── Admin: Plan Management ──────────────────────────────────────────────────

exports.createPlan = async (req, res) => {
  try {
    const activePlanCount = await internSubscriptionService.countActivePlans();
    if (activePlanCount >= 3) {
      return errorResponse(
        res,
        "Only three intern subscription plans can be created",
        400,
      );
    }

    const { data, error } = normalizePlanPayload(req.body);
    if (error) return errorResponse(res, error, 400);

    if (data.isFreePlan) {
      const activeFreePlanCount =
        await internSubscriptionService.countActiveFreePlans();
      if (activeFreePlanCount >= 1) {
        return errorResponse(res, "Only one free plan can be created", 400);
      }
    }

    await internSubscriptionService.createPlan(data);

    return successResponse(res, {}, "Plan created successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getPlansForAdmin = async (req, res) => {
  try {
    const plans = await internSubscriptionService.getAllPlansForAdmin();
    return successResponse(res, plans, "Plans fetched successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params || {};

    if (!id) return errorResponse(res, "Plan id is required", 400);

    const existing = await internSubscriptionService.getPlanById(id);
    if (!existing) return errorResponse(res, "Plan not found", 404);

    const { data, error } = normalizePlanPayload(req.body, true);
    if (error) return errorResponse(res, error, 400);

    if (data.isFreePlan) {
      const activeFreePlanCount =
        await internSubscriptionService.countActiveFreePlans(id);
      if (activeFreePlanCount >= 1) {
        return errorResponse(res, "Only one free plan can be created", 400);
      }
    }

    await internSubscriptionService.updatePlan(id, data);

    return successResponse(res, {}, "Plan updated successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) return errorResponse(res, "Plan id is required", 400);

    const existing = await internSubscriptionService.getPlanById(id);
    if (!existing) return errorResponse(res, "Plan not found", 404);

    await internSubscriptionService.deletePlan(id);
    return successResponse(res, {}, "Plan deleted permanently", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── Intern: Public Plans ────────────────────────────────────────────────────

exports.getActivePlans = async (req, res) => {
  try {
    const plans = await internSubscriptionService.getActivePlans();
    return successResponse(res, plans, "Plans fetched successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

// ─── Intern: Purchase Flow ───────────────────────────────────────────────────

exports.createOrder = async (req, res) => {
  try {
    const internId = req.user.id;
    const { planId } = req.body || {};

    if (!planId) return errorResponse(res, "Plan id is required", 400);

    const plan = await internSubscriptionService.getPlanById(planId);
    if (!plan || plan.isDelete) return errorResponse(res, "Plan not found", 404);
    if (plan.isFreePlan) {
      return errorResponse(res, "Free plan does not require payment", 400);
    }

    const existingActive = await internSubscriptionService.getActiveSubscription(internId);
    if (
      existingActive?.planId === planId &&
      existingActive.interviewCreditsRemaining > 0
    ) {
      return errorResponse(
        res,
        "You can buy credits for the same plan after your current credits are finished",
        400,
      );
    }

    const options = {
      amount: plan.discountedPrice * 100,
      currency: "INR",
      receipt: `intern_sub_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
      planId,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const internId = req.user.id;
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};

    if (!planId) return errorResponse(res, "Plan id is required", 400);
    if (!razorpay_order_id) return errorResponse(res, "Razorpay order id is required", 400);
    if (!razorpay_payment_id) return errorResponse(res, "Razorpay payment id is required", 400);
    if (!razorpay_signature) return errorResponse(res, "Razorpay signature is required", 400);

    const plan = await internSubscriptionService.getPlanById(planId);
    if (!plan) return errorResponse(res, "Plan not found", 404);
    if (plan.isFreePlan) {
      return errorResponse(res, "Free plan does not require payment", 400);
    }

    const existingActive = await internSubscriptionService.getActiveSubscription(internId);
    if (
      existingActive?.planId === planId &&
      existingActive.interviewCreditsRemaining > 0
    ) {
      return errorResponse(
        res,
        "You can buy credits for the same plan after your current credits are finished",
        400,
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return errorResponse(res, "Payment verification failed", 400);
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      return errorResponse(res, "Payment not captured", 400);
    }

    const carriedCredits = existingActive?.interviewCreditsRemaining || 0;
    if (existingActive) {
      await internSubscriptionService.deactivateSubscription(existingActive.id);
    }

    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.duration);

    await internSubscriptionService.createSubscription({
      internId,
      planId,
      interviewCreditsTotal: plan.interviewCredits + carriedCredits,
      interviewCreditsRemaining: plan.interviewCredits + carriedCredits,
      subscriptionStart,
      subscriptionEnd,
      amountPaid: plan.discountedPrice,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return successResponse(res, {}, "Subscription activated successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.activateFreePlan = async (req, res) => {
  try {
    const internId = req.user.id;
    const { planId } = req.body || {};

    if (!planId) return errorResponse(res, "Plan id is required", 400);

    const plan = await internSubscriptionService.getPlanById(planId);
    if (!plan || plan.isDelete || !plan.isFreePlan) {
      return errorResponse(res, "Free plan not found", 404);
    }

    const usedFreePlan = await internSubscriptionService.hasUsedFreePlan(internId);
    if (usedFreePlan) {
      return errorResponse(res, "Free plan can be used only once", 400);
    }

    const existingActive = await internSubscriptionService.getActiveSubscription(internId);
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.duration);

    if (existingActive) {
      await internSubscriptionService.addCredits(existingActive.id, plan.interviewCredits);
      await internSubscriptionService.createSubscription({
        internId,
        planId,
        interviewCreditsTotal: plan.interviewCredits,
        interviewCreditsRemaining: plan.interviewCredits,
        subscriptionStart,
        subscriptionEnd,
        isActive: false,
        amountPaid: 0,
      });
    } else {
      await internSubscriptionService.createSubscription({
        internId,
        planId,
        interviewCreditsTotal: plan.interviewCredits,
        interviewCreditsRemaining: plan.interviewCredits,
        subscriptionStart,
        subscriptionEnd,
        amountPaid: 0,
      });
    }

    return successResponse(res, {}, "Free plan activated successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const internId = req.user.id;
    const subscription = await internSubscriptionService.getActiveSubscription(internId);

    if (!subscription) {
      return successResponse(res, null, "No active subscription", 200);
    }

    return successResponse(res, subscription, "Subscription fetched successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};
