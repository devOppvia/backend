const express = require("express")
const router = express.Router()
const candidateManagementControllers = require("../../controllers/CandidateManagement/candidateManagement.controller")

router.post("/applyJob", candidateManagementControllers.applyJob)
router.post("/get-candidates", candidateManagementControllers.getAppliedCandidatesForCompany)
router.get("/get-candidate-details/:id", candidateManagementControllers.getCandidateDetailsBasedOnId)
router.put("/update-status/:id", candidateManagementControllers.updateCandidateStatus)
router.delete("/delete-candidate/:id", candidateManagementControllers.deleteAppliedCandidate)
router.get("/download-resume/:id", candidateManagementControllers.downloadResume)

module.exports = router