const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const aiInterviewController = require("../../controllers/AIInterview/aiInterview.controller");
const aiInterviewResultController = require("../../controllers/AIInterview/aiInterviewResult.controller");

// ── History & stats (must come before /:id to avoid param conflicts) ──────────
router.get("/my/history", authMiddleware, aiInterviewResultController.getHistory);
router.get("/my/stats", authMiddleware, aiInterviewResultController.getStats);

// ── Setup & session lifecycle ─────────────────────────────────────────────────
router.post("/create", authMiddleware, aiInterviewController.createInterview);
router.post("/:id/start", authMiddleware, aiInterviewController.startInterview);
router.post("/:id/answer", authMiddleware, aiInterviewController.submitAnswer);
router.post("/:id/complete", authMiddleware, aiInterviewController.completeInterview);
router.post("/:id/expression", authMiddleware, aiInterviewController.saveExpression);

// ── Results ───────────────────────────────────────────────────────────────────
router.get("/:id/result", authMiddleware, aiInterviewResultController.getResult);
router.get("/:id/questions", authMiddleware, aiInterviewResultController.getQuestions);
router.get("/:id/expressions", authMiddleware, aiInterviewResultController.getExpressions);

// ── Detail (after specific paths) ────────────────────────────────────────────
router.get("/:id", authMiddleware, aiInterviewResultController.getInterviewDetail);

module.exports = router;
