const express = require("express");
const router = express.Router();
const { getHomePageJobs } = require("../../controllers/Home/home.controllers");
router.get("/get-job-list", getHomePageJobs);

module.exports = router;
