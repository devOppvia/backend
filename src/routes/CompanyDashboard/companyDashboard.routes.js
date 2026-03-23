const express = require("express")
const router = express.Router()
const companyDashboardController = require("../../controllers/CompanyDashboard/companyDashboard.controller")


router.post("/get-dashboard-details",companyDashboardController.getCompanyDashboardDetails)
router.post("/candidate/get-dashboard-details",companyDashboardController.getCompanyDashboardCandidateDetails)
router.post("/job-count/get-dashboard-details",companyDashboardController.getJobCountStatus)
router.post("/job-status/get-dashboard-details", companyDashboardController.getCompanyDashboardJobDetails)
router.post("/candidate-details/get-dashboard-details", companyDashboardController.getCompanyDashboardRecentAppliedDetails)
router.post("/interviews/get-all-interviews", companyDashboardController.getAllInterviews)
router.post("/credits-and-stats/get-dashboard-details", companyDashboardController.getCompanyCreditsAndStats)

module.exports = router
