const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/AICall/aiCall.controller");
const webhook = require("../../controllers/AICall/aiCallWebhook.controller");

// ── Company dashboard routes (authenticated) ──────────────────────────────────
router.post("/questions", ctrl.addQuestion);
router.get("/questions/:companyId", ctrl.getQuestions);
router.put("/questions/:id", ctrl.updateQuestion);
router.delete("/questions/:id", ctrl.deleteQuestion);
router.get("/results/:candidateManagementId", ctrl.getCallResults);

// ── Twilio webhook routes (NO auth — Twilio posts here) ───────────────────────
// Note: URLs now include attemptId so each attempt is tracked precisely
router.post("/webhook/intro/:callId/:attemptId", webhook.webhookIntro);
router.post("/webhook/question/:callId/:attemptId/:questionIndex", webhook.webhookQuestion);
router.post("/webhook/question/:callId/:attemptId/:questionIndex/:retryCount", webhook.webhookQuestion);
router.post(
  "/webhook/answer/:callId/:attemptId/:questionIndex",
  webhook.webhookAnswer,
);
router.post("/webhook/complete/:callId/:attemptId", webhook.webhookComplete);

module.exports = router;
