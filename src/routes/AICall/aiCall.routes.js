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

// ── Retell webhook route (NO auth — Retell posts here) ────────────────────────
router.post("/webhook/retell", webhook.webhookRetell);

module.exports = router;
