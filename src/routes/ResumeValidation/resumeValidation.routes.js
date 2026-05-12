const express = require("express");
const router = express.Router();
const resumeValidationController = require("../../controllers/ResumeValidation/resumeValidation.controller");

router.post("/validate", resumeValidationController.validateResume);

module.exports = router;
