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
// Intro: connects Twilio media stream to X AI Realtime (bidirectional audio)
router.post("/webhook/intro/:callId/:attemptId", webhook.webhookIntro);
// Complete: call ended — score & store conversation
router.post("/webhook/complete/:callId/:attemptId", webhook.webhookComplete);

// ── Old webhook routes (commented out — X AI Realtime handles conversation) ───
// router.post("/webhook/question/:callId/:attemptId/:questionIndex", webhook.webhookQuestion);
// router.post("/webhook/question/:callId/:attemptId/:questionIndex/:retryCount", webhook.webhookQuestion);
// router.post("/webhook/answer/:callId/:attemptId/:questionIndex", webhook.webhookAnswer);

module.exports = router;
