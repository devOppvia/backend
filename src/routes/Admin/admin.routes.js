const express = require("express")
const router = express.Router()
const adminControllers = require("../../controllers/Admin/admin.controller")

router.post("/get-dashboard-details", adminControllers.getDashboardDetails)

module.exports = router