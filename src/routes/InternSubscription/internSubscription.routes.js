const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const isAdminMiddleware = require("../../middlewares/isAdminMiddleware");
const internSubscriptionController = require("../../controllers/InternSubscription/internSubscription.controller");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/plans", internSubscriptionController.getActivePlans);

// ── Intern (authenticated) ────────────────────────────────────────────────────
router.post("/create-order", authMiddleware, internSubscriptionController.createOrder);
router.post("/verify-payment", authMiddleware, internSubscriptionController.verifyPayment);
router.get("/my", authMiddleware, internSubscriptionController.getMySubscription);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post("/admin/plans", authMiddleware, isAdminMiddleware, internSubscriptionController.createPlan);
router.get("/admin/plans", authMiddleware, isAdminMiddleware, internSubscriptionController.getPlansForAdmin);
router.put("/admin/plans/:id", authMiddleware, isAdminMiddleware, internSubscriptionController.updatePlan);
router.delete("/admin/plans/:id", authMiddleware, isAdminMiddleware, internSubscriptionController.deletePlan);

module.exports = router;
