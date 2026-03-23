const express = require("express")
const router = express.Router()
const { getInternNotifications } = require("../../controllers/InternNotification/internNotification.controller")

router.get("/:internId", getInternNotifications)

module.exports = router