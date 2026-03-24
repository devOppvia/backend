const express = require("express")
const router = express.Router()
const adminControllers = require("../../controllers/Admin/admin.controller")
const authMiddleware = require("../../middlewares/authMiddleware")
const isAdmin = require("../../middlewares/isAdminMiddleware")

router.post("/get-dashboard-details",authMiddleware,isAdmin, adminControllers.getDashboardDetails)

module.exports = router