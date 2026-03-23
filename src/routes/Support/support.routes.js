const express = require("express");
const router = express.Router();
const supportController = require("../../controllers/Support/support.controller");
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
// ===== Middleware: Validate File Size =====
const validateFileSizes = (req, res, next) => {
  try {
    const attachment = req.files?.attachment?.[0];

    if (attachment && attachment.size > 2 * 1024 * 1024) {
      fs.unlinkSync(attachment.path); // delete the oversized file
      return res.status(400).json({
        success: false,
        message: "Attachment size must be 2 MB or less.",
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
  "/create-support",
  uploads.fields([{ name: "attachment" }]),validateFileSizes,
  supportController.createSupport
);
router.post(
  "/company/get-all-supports",
  supportController.getAllCompanySupport
);
router.post(
  "/admin/get-all-supports",
  supportController.getAllCompanySupportForAdmin
);
router.post(
  "/get-support-messages",
  supportController.getAllCompanySupportMessages
);
router.post(
  "/add-support-message",
  uploads.fields([{ name: "attachment" }]),validateFileSizes,
  supportController.addMessageToSupport
);
router.post("/close-support", supportController.closeSupport);

module.exports = router;
