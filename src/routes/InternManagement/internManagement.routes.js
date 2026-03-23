const express = require("express");
const router = express.Router();
const internManagementControllers = require("../../controllers/InternManagement/internManagement.controller");
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
// ===== Field-specific File Size Validation =====
const validateFileSizes = (req, res, next) => {
  try {
    const profilePicture = req.files?.profilePicture?.[0];
    const resume = req.files?.resume?.[0];

    if (profilePicture && profilePicture.size > 1 * 1024 * 1024) {
      fs.unlinkSync(profilePicture.path); // Delete oversized file
      return res.status(400).json({
        success: false,
        message: "Profile picture must be 1MB or less.",
      });
    }

    if (resume && resume.size > 5 * 1024 * 1024) {
      fs.unlinkSync(resume.path); // Delete oversized file
      return res.status(400).json({
        success: false,
        message: "Resume must be 5MB or less.",
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
  "/registration",
  uploads.fields([{ name: "profilePicture" }, { name: "resume" }]),validateFileSizes,
  internManagementControllers.internRegistration
);

module.exports = router;
