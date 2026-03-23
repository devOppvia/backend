const express = require("express")
const router = express.Router()
const notificationController = require("../../controllers/Notifications/notifications.controller")

router.get("/:companyId", notificationController.getCompanyNotifications)

module.exports = router