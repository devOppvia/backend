const express = require("express")
const router = express.Router()
const jobAlertController = require("../../controllers/JobAlert/jobAlert.controller")


router.post("/get-applied-jobs", jobAlertController.getInternJobAlert)
router.delete("/delete-profile/:internId", jobAlertController.deleteInternProfile)
router.delete("/delete-applied-job/:id", jobAlertController.deleteAppliedJobAlert)
router.put("/accept-job-offer/:id", jobAlertController.acceptTheOfferAndJoinCompany)
module.exports = router