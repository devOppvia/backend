const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const aiInterviewXController = require("../../controllers/AIInterview/aiInterviewX.controller");
const aiInterviewResultController = require("../../controllers/AIInterview/aiInterviewResult.controller");

// ── Setup & session lifecycle ─────────────────────────────────────────────────
router.post("/create", authMiddleware, aiInterviewXController.createInterview);
router.post("/:id/start", authMiddleware, aiInterviewXController.startInterview);
router.get("/:id/resume", authMiddleware, aiInterviewXController.resumeInterview);
router.post("/:id/complete", authMiddleware, aiInterviewXController.completeInterview);
router.get("/:id/status", authMiddleware, aiInterviewXController.getInterviewStatus);
router.post("/:id/expression", authMiddleware, aiInterviewXController.saveExpression);

// ── Results (reuse existing result controller) 
router.get("/my/history", authMiddleware, aiInterviewResultController.getHistory);
router.get("/my/stats", authMiddleware, aiInterviewResultController.getStats);
router.get("/:id/result", authMiddleware, aiInterviewResultController.getResult);
router.get("/:id/questions", authMiddleware, aiInterviewResultController.getQuestions);
router.get("/:id/expressions", authMiddleware, aiInterviewResultController.getExpressions);
router.get("/:id", authMiddleware, aiInterviewResultController.getInterviewDetail);

module.exports = router;
