const express = require("express")
const router = express.Router()
const locationController = require("../../controllers/Locations/location.controller")

router.get("/countries", locationController.getCountries)
router.get("/states", locationController.getStatesByCountry)
router.get("/cities/:stateCode", locationController.getCitiesByState)
router.post("/preferred-cities", locationController.getPreferredCities)

module.exports = router