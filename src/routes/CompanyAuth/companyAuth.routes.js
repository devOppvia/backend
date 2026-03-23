const express = require("express");
const router = express.Router();
const companyAuthController = require("../../controllers/CompanyAuth/companyAuth.controller");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

const MAX_FILE_SIZES = {
  logo: 2 * 1024 * 1024,      // 2MB
  smallLogo: 1 * 1024 * 1024, // 1MB
};

const uploads = multer({
  storage,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZES)),
  },
});

const checkFieldSize = (req, res, next) => {
  const files = req.files;

  if (files) {
    for (const field in files) {
      const file = files[field][0];
      const maxSize = MAX_FILE_SIZES[field];

      if (maxSize && file.size > maxSize) {
        let message = "";

        switch (field) {
          case "logo":
            message = "Logo file size exceeds 2MB limit. Please upload a smaller image.";
            break;
          case "smallLogo":
            message = "Small Logo file size exceeds 1MB limit. Please upload a smaller image.";
            break;
          default:
            message = `${field} file size exceeds the allowed limit of ${maxSize / 1024 / 1024}MB.`;
        }

        return res.status(400).json({
          success: false,
          field,
          message,
        });
      }
    }
  }

  next();
};

const handleMulterError = (err, req, res, next) => {
  console.error("Multer Error ::", err);

  if (err instanceof multer.MulterError) {
    let message = "File upload error.";
    if (err.code === "LIMIT_FILE_SIZE") {
      if (err.field === "logo") {
        message = "Logo file size exceeds 2MB limit. Please upload a smaller image.";
      } else if (err.field === "smallLogo") {
        message = "Small Logo file size exceeds 1MB limit. Please upload a smaller image.";
      } else {
        message = `${err.field || "File"} size exceeds allowed limit.`;
      }
    }

    return res.status(400).json({
      success: false,
      field: err.field,
      message,
    });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  next();
};

// const uploads = multer({ storage: storage });

router.post(
  "/registration-step1",
  companyAuthController.companyRegistrationStep1
);
// router.post(
//   "/registration-step2",
//   uploads.fields([{ name: "logo" }, { name: "smallLogo" }]),
//   checkFieldSize,
//   companyAuthController.companyRegistrationStep2
// );

router.post(
  "/registration-step2",
  uploads.fields([{ name: "logo" }, { name: "smallLogo" }]),
  checkFieldSize,
  handleMulterError,
  companyAuthController.companyRegistrationStep2
);
router.post(
  "/registration-step3",
  companyAuthController.companyRegistrationStep3
);
router.post(
  "/registration-step4",
  companyAuthController.companyRegistrationStep4
);

router.post("/forgot-password", companyAuthController.forgotPasswordSendMail);
router.post("/reset-password", companyAuthController.forgotPassword);
router.post("/login", companyAuthController.companyLogin);
router.get("/:companyId", companyAuthController.companyLogout);

router.post("/verify-company-email-otp/:companyId", companyAuthController.verifyCompanyEmailOtp)
router.post("/resend-company-email-otp/:companyId", companyAuthController.resendCompanyEmailOtp)

router.post("/verify-company-mobile-otp/:companyId", companyAuthController.verifyCompanyMobileOtp)
router.post("/resend-company-mobile-otp/:companyId", companyAuthController.resendCompanyMobileOtp)





router.post("/update-company-email-otp/:id", companyAuthController.sendUpdateEmailOtp)
router.post("/verify-company-old-email-otp/:id", companyAuthController.verifyOldEmailOtp)
router.post("/send-company-new-email-otp/:id", companyAuthController.sendOtpNewEmail)
router.post("/verify-otp-and-update-email/:id", companyAuthController.verifyNewEmailAndUpdateEmail)

router.post("/update-company-mobile-otp/:id", companyAuthController.sendUpdateMobileOtp)
router.post("/verify-company-old-mobile-otp/:id", companyAuthController.verifyOldMobileOtp)
router.post("/send-company-new-mobile-otp/:id", companyAuthController.sendOtpNewMobile)
router.post("/verify-otp-and-update-mobile/:id", companyAuthController.verifyNewMobileAndUpdateMobile)
module.exports = router;
