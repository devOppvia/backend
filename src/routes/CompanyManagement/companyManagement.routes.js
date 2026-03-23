const express = require("express");
const router = express.Router();
const companyManagementControllers = require("../../controllers/CompanyManagement/companyManagement.controller");
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
  limits: { fileSize: 2 * 1024 * 1024 },
});

const validateFileSizes = (req, res, next) => {
  try {
    const logoFile = req.files?.logo?.[0];
    const smallLogoFile = req.files?.smallLogo?.[0];
    const companyLogoFile = req.files?.companyLogo?.[0];
    const companySmallLogoFile = req.files?.companySmallLogo?.[0];
    const companySortLogoFile = req.files?.companySortLogo?.[0];

    if (logoFile && logoFile.size > 2 * 1024 * 1024) {
      fs.unlinkSync(logoFile.path); 
      return res.status(400).json({
        success: false,
        message: "Logo size must be 2MB or less.",
      });
    }

    if (smallLogoFile && smallLogoFile.size > 1 * 1024 * 1024) {
      fs.unlinkSync(smallLogoFile.path);
      return res.status(400).json({
        success: false,
        message: "Small logo size must be 1MB or less.",
      });
    }

    if (companyLogoFile && companyLogoFile.size > 2 * 1024 * 1024) {
      fs.unlinkSync(companyLogoFile.path);
      return res.status(400).json({
        success: false,
        message: "Company logo size must be 2MB or less.",
      });
    }

    if (companySmallLogoFile && companySmallLogoFile.size > 1 * 1024 * 1024) {
      fs.unlinkSync(companySmallLogoFile.path);
      return res.status(400).json({
        success: false,
        message: "Company small logo size must be 1MB or less.",
      });
    }

    if (companySortLogoFile && companySortLogoFile.size > 1 * 1024 * 1024) {
      fs.unlinkSync(companySortLogoFile.path);
      return res.status(400).json({
        success: false,
        message: "Company short logo size must be 1MB or less.",
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
  "/company-registration",
  uploads.fields([{ name: "logo" }]),
  validateFileSizes,
  companyManagementControllers.companyRegistration
);
router.get(
  "/get-registered-companies/:companyStatus",
  companyManagementControllers.getRegisteredCompaniesBasedOnStatus
);
router.get(
  "/get-company-details/:companyId",
  companyManagementControllers.getCompanyDetailsById
);
router.put(
  "/update-company-status/:companyId",
  companyManagementControllers.changeCompanyStatus
);
router.put(
  "/update-details/:id",
  uploads.fields([{ name: "logo" }]),
  validateFileSizes,
  companyManagementControllers.updateCompanyDetails
);
router.delete(
  "/delete-company/:id",
  companyManagementControllers.deleteCompanyDetails
);
router.post(
  "/registration-1",
  companyManagementControllers.companyRegistrationStep1
);
router.post(
  "/registration-2/:draftId",
  uploads.fields([{ name: "companyLogo" }, { name: "companySortLogo" }]),
  validateFileSizes,
  companyManagementControllers.companyRegistrationStep2
);
router.post(
  "/registration-3/:draftId",
  companyManagementControllers.companyRegistrationStep3
);
router.post(
  "/registration-4/:draftId",
  companyManagementControllers.companyRegistrationStep4
);

router.get(
  "/get-company-detail/:companyId",
  companyManagementControllers.getCompanyDetailsBasedOnCompanyId
);

router.put(
  "/update-company-profile/:companyId",
  uploads.fields([{ name: "companyLogo" }, { name: "companySmallLogo" }]),
  validateFileSizes,
  companyManagementControllers.updateCompanyProfile
);
router.get(
  "/get-industries",
  companyManagementControllers.getCompanyIndustries
);
module.exports = router;
