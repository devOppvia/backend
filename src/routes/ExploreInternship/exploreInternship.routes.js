const express = require("express");
const router = express.Router();
const exploreInternshipControllers = require("../../controllers/ExploreInternship/exploreInternship.controller");

router.get(
  "/filters",
  exploreInternshipControllers.getExploreInternshipFilters
);
router.get(
  "/companies",
  exploreInternshipControllers.getExploreInternshipCompanies
);

router.post("/get-internships", exploreInternshipControllers.getInternships)
router.post("/get-random-one-internship", exploreInternshipControllers.getRandomOneInternship)

router.post("/get-internship-details", exploreInternshipControllers.getInternshipDetails)
router.post("/details", exploreInternshipControllers.expoloreInternShipDetails)
router.post("/info", exploreInternshipControllers.exploreInternshipJobInfoByStatus)
module.exports = router;
