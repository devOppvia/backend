const express = require("express");
const router = express.Router();
const {
  createContactUs,
  getAllContactUs
} = require("../../controllers/ContactUs/contactUs.controller");

router.post("/submit", createContactUs);
router.get("/", getAllContactUs);

module.exports = router;
