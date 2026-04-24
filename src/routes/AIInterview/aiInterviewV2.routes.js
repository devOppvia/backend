const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const controller = require('../../controllers/AIInterview/aiInterviewV2.controller');
const aiInterviewResultController = require('../../controllers/AIInterview/aiInterviewResult.controller');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Core interview lifecycle
router.post('/create', authMiddleware, controller.createInterview);
router.post('/:id/start', authMiddleware, controller.startInterview);
router.get('/:id/next-question', authMiddleware, controller.getNextQuestion);
router.post('/:id/tts', authMiddleware, controller.textToSpeech);
router.post('/:id/stt', authMiddleware, upload.single('audio'), controller.speechToText);
router.post('/:id/answer', authMiddleware, controller.submitAnswer);
router.post('/:id/expression', authMiddleware, controller.submitExpression);
router.post('/:id/complete', authMiddleware, controller.completeInterview);

// Results & history (reuse existing result controller)
router.get('/my/history', authMiddleware, aiInterviewResultController.getHistory);
router.get('/my/stats', authMiddleware, aiInterviewResultController.getStats);
router.get('/:id/result', authMiddleware, controller.getResult);
router.get('/:id/questions', authMiddleware, controller.getQuestions);
router.get('/:id/expressions', authMiddleware, aiInterviewResultController.getExpressions);
router.get('/download-pdf/:id', authMiddleware, controller.downloadPdf);
router.get('/:id', authMiddleware, aiInterviewResultController.getInterviewDetail);

module.exports = router;
