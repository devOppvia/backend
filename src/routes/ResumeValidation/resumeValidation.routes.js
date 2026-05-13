const express = require("express");
const router = express.Router();
const resumeValidationController = require("../../controllers/ResumeValidation/resumeValidation.controller");

router.post("/validate", resumeValidationController.validateResume);
router.post("/extract-name", resumeValidationController.extractCandidateName);

module.exports = router;
