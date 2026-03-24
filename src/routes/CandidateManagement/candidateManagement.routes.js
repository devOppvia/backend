const express = require("express")
const router = express.Router()
const candidateManagementControllers = require("../../controllers/CandidateManagement/candidateManagement.controller")
const authMiddleware = require("../../middlewares/authMiddleware")

router.post("/applyJob", authMiddleware ,candidateManagementControllers.applyJob)
router.post("/get-candidates", authMiddleware ,candidateManagementControllers.getAppliedCandidatesForCompany)
router.get("/get-candidate-details/:id", authMiddleware ,candidateManagementControllers.getCandidateDetailsBasedOnId)
router.put("/update-status/:id", authMiddleware ,candidateManagementControllers.updateCandidateStatus)
router.delete("/delete-candidate/:id", authMiddleware ,candidateManagementControllers.deleteAppliedCandidate)
router.get("/download-resume/:id", authMiddleware ,candidateManagementControllers.downloadResume)

module.exports = router