const express = require("express");
const router = express.Router();
const userManagementControllers = require("../../controllers/UserManagement/userManagement.controller");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

const uploads = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
// ===== File Size Validation Middleware =====
const validateFileSizes = (req, res, next) => {
  try {
    const resume = req.files?.resume?.[0];

    if (resume && resume.size > 5 * 1024 * 1024) {
      fs.unlinkSync(resume.path); // Delete oversized file
      return res.status(400).json({
        success: false,
        message: "Resume size must be 5MB or less.",
      });
    }

    next();
  } catch (error) {
    console.error("File size validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during file validation.",
    });
  }
};
router.post(
  "/student-registration",
  uploads.fields([{ name: "resume" }]),validateFileSizes,
  userManagementControllers.studentRegistration
);
router.post(
  "/get-registered-students",
  userManagementControllers.getStudentDetailsByStatus
);
router.put(
  "/update-student-status/:id",
  userManagementControllers.updateStudentStatus
);
router.delete(
  "/delete-student-details/:id",
  userManagementControllers.deleteStudentDetails
);

module.exports = router;
