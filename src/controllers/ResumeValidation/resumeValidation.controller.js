const { errorResponse, successResponse } = require("../../utils/responseHeader");
const resumeValidationService = require("../../services/ResumeValidation/resumeValidation.service");

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
