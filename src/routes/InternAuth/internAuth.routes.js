const express = require("express");
const router = express.Router();
const internAuthController = require("../../controllers/InternAuth/internAuth.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const multer = require("multer");
const fs = require("fs");
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// ===== Field-specific file size validation =====
const validateFileSizes = (req, res, next) => {
  try {
    const profilePicture = req.files?.profile_picture?.[0];
    const profilePictureUpdate = req.files?.profilePicture?.[0]; // for update route
    const resume = req.files?.resume?.[0];

    if (profilePicture && profilePicture.size > 1 * 1024 * 1024) {
      fs.unlinkSync(profilePicture.path); // delete the oversized file
      return res.status(400).json({
        success: false,
        message: "Profile picture size must be 1MB or less.",
      });
    }

    if (profilePictureUpdate && profilePictureUpdate.size > 1 * 1024 * 1024) {
      fs.unlinkSync(profilePictureUpdate.path);
      return res.status(400).json({
        success: false,
        message: "Profile picture size must be 1MB or less.",
      });
    }

    if (resume && resume.size > 5 * 1024 * 1024) {
      fs.unlinkSync(resume.path);
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
const uploads = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/registration-step1",
  uploads.fields([{ name: "profile_picture" }]),
  validateFileSizes,
  internAuthController.InternRegistrationStep1,
);
router.post(
  "/registration-step2",
  internAuthController.InternRegistrationStep2,
);
router.post(
  "/registration-step3",
  internAuthController.InternRegistrationStep3,
);
router.post(
  "/registration-step4",
  uploads.fields([{ name: "resume" }]),
  validateFileSizes,
  internAuthController.InternRegistrationStep4,
);
router.post(
  "/registration-step5",
  internAuthController.InternRegistrationStep5,
);

router.post("/login", internAuthController.internLogin);
router.get(
  "/get-intern-job-detail/:internId",
  internAuthController.getInternJobProfileDetails,
);
router.get(
  "/get-intern-profile/:internId",
  internAuthController.getInternProfileBasedOnId,
);
router.put(
  "/update-intern-profile/:id",
  uploads.fields([{ name: "profilePicture" }]),
  validateFileSizes,
  internAuthController.updateInternProfileBasedOnId,
);
router.put(
  "/update-intern-job-profile/:id",
  uploads.fields([{ name: "resume" }]),
  validateFileSizes,
  internAuthController.updateInternJobProfileBasedOnId,
);
router.post(
  "/forgot-password",
  internAuthController.sendForgotPasswordMailIntern,
);
router.post("/reset-password", internAuthController.resetInternPassword);

router.post("/open-to-work/:id", internAuthController.isOpenToWorkToggle);
router.get(
  "/get-is-open-to-work/:id",
  internAuthController.getInternOpenToWorkStatus,
);

router.post(
  "/verify-intern-mobile-otp",
  internAuthController.verifyInternMobileNumberOtp,
);
router.post(
  "/resend-intern-mobile-otp",
  internAuthController.resendInternMobileNumberOtp,
);
router.post(
  "/send-intern-email-otp/:id",
  internAuthController.sendOtpInternOtpInEmail,
);
router.post(
  "/verify-intern-email-otp/:id",
  internAuthController.verifyOtpInternOtpInEmail,
);
router.post(
  "/send-intern-mobile-otp/:id",
  internAuthController.sendInternOtpMobileNumber,
);

router.post(
  "/update-intern-email-otp/:id",
  internAuthController.sendUpdateEmailOtp,
);
router.post(
  "/verify-intern-old-email-otp/:id",
  internAuthController.verifyOldEmailOtp,
);
router.post(
  "/send-intern-new-email-otp/:id",
  internAuthController.sendOtpNewEmail,
);
router.post(
  "/verify-otp-and-update-email/:id",
  internAuthController.verifyNewEmailAndUpdateEmail,
);

router.post(
  "/update-intern-mobile-otp/:id",
  internAuthController.sendUpdateMobileOtp,
);
router.post(
  "/verify-intern-old-mobile-otp/:id",
  internAuthController.verifyOldMobileOtp,
);
router.post(
  "/send-intern-new-mobile-otp/:id",
  internAuthController.sendOtpNewMobile,
);
router.post(
  "/verify-otp-and-update-mobile/:id",
  internAuthController.verifyNewMobileAndUpdateMobile,
);
router.post("/generate-about-us", internAuthController.generateAboutUs);

router.post("/switch-to-job", authMiddleware, internAuthController.switchToJob);

module.exports = router;
