const { errorResponse, successResponse } = require("../../utils/responseHeader");
const internSubscriptionService = require("../../services/InternSubscription/internSubscription.service");
const prisma = require("../../config/database");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Admin: Plan Management ──────────────────────────────────────────────────

exports.createPlan = async (req, res) => {
  try {
    const {
      planName,
      description,
      price,
      discountedPrice,
      interviewCredits,
      duration,
      features,
      isPopular = false,
    } = req.body || {};

    if (!planName) return errorResponse(res, "Plan name is required", 400);
    if (!price) return errorResponse(res, "Price is required", 400);
    if (!discountedPrice) return errorResponse(res, "Discounted price is required", 400);
    if (price < discountedPrice) return errorResponse(res, "Price must be greater than discounted price", 400);
    if (!interviewCredits) return errorResponse(res, "Interview credits is required", 400);
    if (!duration) return errorResponse(res, "Duration is required", 400);
    if (!features) return errorResponse(res, "Features is required", 400);

    await internSubscriptionService.createPlan({
      planName: planName.trim(),
      description,
      price,
      discountedPrice,
      interviewCredits,
      duration,
      features,
      isPopular,
    });

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
    const {
      planName,
      description,
      price,
      discountedPrice,
      interviewCredits,
      duration,
      features,
      isPopular,
    } = req.body || {};

    if (!id) return errorResponse(res, "Plan id is required", 400);

    const existing = await internSubscriptionService.getPlanById(id);
    if (!existing) return errorResponse(res, "Plan not found", 404);

    await internSubscriptionService.updatePlan(id, {
      ...(planName && { planName: planName.trim() }),
      ...(description !== undefined && { description }),
      ...(price && { price }),
      ...(discountedPrice && { discountedPrice }),
      ...(interviewCredits && { interviewCredits }),
      ...(duration && { duration }),
      ...(features && { features }),
      ...(isPopular !== undefined && { isPopular }),
    });

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

    await internSubscriptionService.softDeletePlan(id);
    return successResponse(res, {}, "Plan deleted successfully", 200);
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

    // Deactivate existing active subscription if any
    const existingActive = await internSubscriptionService.getActiveSubscription(internId);
    if (existingActive) {
      await internSubscriptionService.deactivateSubscription(existingActive.id);
    }

    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.duration);

    await internSubscriptionService.createSubscription({
      internId,
      planId,
      interviewCreditsTotal: plan.interviewCredits,
      interviewCreditsRemaining: plan.interviewCredits,
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
