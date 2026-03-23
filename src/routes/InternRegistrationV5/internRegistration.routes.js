const express = require("express");
const router = express.Router();
const {
  InternRegistrationSendOtp,
  verifyRegistrationOtp,
  checkExistingEmail,
  internRegistration
} = require("../../controllers/InternRegistrationV5/internRegistration.controller");
const multer = require("multer")
const storage = multer.diskStorage({
  destination : "uploads/",
  filename : function(req, file, cb){
    const uniqueFilename = `${Date.now()}-${file.originalname}`
    cb(null, uniqueFilename)
  }
})

const uploads = multer({ storage : storage})

router.post("/sendOtp", InternRegistrationSendOtp);
router.post("/verifyOtp", verifyRegistrationOtp);
router.post("/check-email", checkExistingEmail)
router.post("/register", uploads.fields([{ name : "profilePicture"}, {name : "resume"}]),internRegistration)

module.exports = router;
