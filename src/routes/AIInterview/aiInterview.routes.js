const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../../middlewares/authMiddleware");
const controller = require("../../controllers/AIInterview/aiInterview.controller");
const resultController = require("../../controllers/AIInterview/aiInterviewResult.controller");

const upload = multer({ storage: multer.memoryStorage() });

// ─── Utilities ────────────────────────────────────────────────────────────────
router.post("/extract-url", authMiddleware, controller.extractUrl);

// ─── Interview Lifecycle ──────────────────────────────────────────────────────
router.post("/create", authMiddleware, controller.createInterview);
router.post("/:id/start", authMiddleware, controller.startInterview);
router.post("/:id/lock/claim", authMiddleware, controller.claimInterviewLock);
router.post("/:id/lock/heartbeat", authMiddleware, controller.heartbeatInterviewLock);
router.post("/:id/lock/release", authMiddleware, controller.releaseInterviewLock);
router.get("/:id/next-question", authMiddleware, controller.getNextQuestion);

// TTS — streams audio/mpeg directly; also writes to disk cache
router.post("/:id/tts", authMiddleware, controller.textToSpeech);

// Replay — serves cached audio for "repeat question" without re-generating
router.get("/:id/audio/:questionNumber", authMiddleware, controller.replayAudio);

// STT — multipart audio file → transcript via ElevenLabs Scribe
router.post("/:id/stt", authMiddleware, upload.single("audio"), controller.speechToText);

router.post("/:id/answer", authMiddleware, controller.submitAnswer);
router.post("/:id/expression", authMiddleware, controller.submitExpression);
router.post("/:id/complete", authMiddleware, controller.completeInterview);

// ─── Results & History ────────────────────────────────────────────────────────
router.get("/my/history", authMiddleware, resultController.getHistory);
router.get("/my/stats", authMiddleware, resultController.getStats);
router.get("/download-pdf/:id", authMiddleware, resultController.downloadPdf);
router.get("/:id/result", authMiddleware, resultController.getResult);
router.get("/:id/questions", authMiddleware, resultController.getQuestions);
router.get("/:id/expressions", authMiddleware, resultController.getExpressions);
router.get("/:id", authMiddleware, resultController.getInterviewDetail);

module.exports = router;
