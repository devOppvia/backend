const express = require("express")
const router = express.Router()
const internDashboardController = require("../../controllers/InternDashboard/internDashboard.controller")


router.get("/recommended-opportunities/:InternId",internDashboardController.getRecommendedOpportunities)
router.get("/:internId", internDashboardController.getInternDashboardDetails)

module.exports = router
