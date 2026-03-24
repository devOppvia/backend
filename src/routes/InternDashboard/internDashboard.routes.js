const express = require("express")
const router = express.Router()
const internDashboardController = require("../../controllers/InternDashboard/internDashboard.controller")
const authMiddleware = require("../../middlewares/authMiddleware")


router.get("/recommended-opportunities/:InternId",authMiddleware,internDashboardController.getRecommendedOpportunities)
router.get("/:internId", authMiddleware, internDashboardController.getInternDashboardDetails)

module.exports = router
