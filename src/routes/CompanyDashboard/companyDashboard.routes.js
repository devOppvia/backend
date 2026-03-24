const express = require("express")
const router = express.Router()
const companyDashboardController = require("../../controllers/CompanyDashboard/companyDashboard.controller")
const authMiddleware = require("../../middlewares/authMiddleware")


router.post("/get-dashboard-details",authMiddleware,companyDashboardController.getCompanyDashboardDetails)
router.post("/candidate/get-dashboard-details",authMiddleware,companyDashboardController.getCompanyDashboardCandidateDetails)
router.post("/job-count/get-dashboard-details",authMiddleware,companyDashboardController.getJobCountStatus)
router.post("/job-status/get-dashboard-details", authMiddleware, companyDashboardController.getCompanyDashboardJobDetails)
router.post("/candidate-details/get-dashboard-details", authMiddleware, companyDashboardController.getCompanyDashboardRecentAppliedDetails)
router.post("/interviews/get-all-interviews", authMiddleware, companyDashboardController.getAllInterviews)
router.post("/credits-and-stats/get-dashboard-details",authMiddleware, companyDashboardController.getCompanyCreditsAndStats)

module.exports = router
