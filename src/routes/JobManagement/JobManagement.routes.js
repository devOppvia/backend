const express = require("express")
const router = express.Router()
const jobManagementControllers = require("../../controllers/JobManagement/JobManagement.controller")

router.post("/submit-job-opening", jobManagementControllers.submitJobOpening)
router.post("/get-jobs", jobManagementControllers.getJobsBasedOnStatus)
router.get("/get-job-details/:jobId", jobManagementControllers.getJobDetails)
router.post("/admin/get-jobs", jobManagementControllers.getJobsBasedOnStatusForAdmin)
router.post("/about-job", jobManagementControllers.getTheSuggentionFromAiForJobDescription)
router.put("/update-job-status/:jobId", jobManagementControllers.updateJobStatus)
router.put("/update-job-details/:jobId", jobManagementControllers.updateJobDetails)
router.delete("/delete-job/:jobId", jobManagementControllers.deleteJobDetailsByCompanys)
router.get("/get-company-locations/:companyId", jobManagementControllers.getCompanyLocations)
router.put("/update-bulk-status", jobManagementControllers.updateJobBulkStatusUpdate)
router.post("/generate-job-about", jobManagementControllers.generateJobAbout)
router.post("/generate-job-other-requirements", jobManagementControllers.generateJobOtherRequirements)

router.post("/generate-role-title", jobManagementControllers.generateRoleTitle)
router.post("/generate-subcategory", jobManagementControllers.generateSubCategory)

module.exports = router