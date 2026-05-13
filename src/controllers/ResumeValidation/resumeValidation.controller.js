const { errorResponse, successResponse } = require("../../utils/responseHeader");
const resumeValidationService = require("../../services/ResumeValidation/resumeValidation.service");

exports.extractCandidateName = async (req, res) => {
  try {
    const { resumeText } = req.body || {};

    if (!resumeText || typeof resumeText !== "string") {
      return errorResponse(res, "resumeText is required", 400);
    }

    if (resumeText.length > 50000) {
      return errorResponse(res, "resumeText must not exceed 50000 characters", 400);
    }

    const result = await resumeValidationService.extractCandidateNameFromResume(resumeText);

    return successResponse(res, result, "Candidate name extracted");
  } catch (error) {
    console.error("Extract candidate name error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
};

exports.validateResume = async (req, res) => {
  try {
    const { resumeText, text } = req.body || {};
    const submittedText = resumeText || text;

    if (!submittedText || typeof submittedText !== "string") {
      return errorResponse(res, "Resume text is required", 400);
    }

    if (submittedText.length > 50000) {
      return errorResponse(res, "Resume text must not exceed 50000 characters", 400);
    }

    const result = await resumeValidationService.validateResumeText(submittedText);

    return successResponse(
      res,
      result,
      result.isValid ? "Valid resume" : "Invalid resume",
    );
  } catch (error) {
    console.error("Resume validation error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
};
