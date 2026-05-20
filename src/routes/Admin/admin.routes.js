const express = require("express")
const router = express.Router()
const adminControllers = require("../../controllers/Admin/admin.controller")
const authMiddleware = require("../../middlewares/authMiddleware")
const isAdmin = require("../../middlewares/isAdminMiddleware")

router.post("/get-dashboard-details",authMiddleware,isAdmin, adminControllers.getDashboardDetails)
router.post("/get-incomplete-profile-interns",authMiddleware,isAdmin, adminControllers.getIncompleteProfileInterns)
router.post("/get-pending-profile-companies",authMiddleware,isAdmin, adminControllers.getPendingProfileCompletionCompanies)

module.exports = router