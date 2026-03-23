const express = require("express")
const router = express.Router()
const { scheduleInterview,getScheduledInterviewIntern,joinInterview } = require("../../controllers/Interview/interview.controller")

router.post("/schedule", scheduleInterview)
router.get("/get-scheduled-interview/:internId", getScheduledInterviewIntern)
router.put("/join-interview/:id", joinInterview)

module.exports = router