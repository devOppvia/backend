const express = require("express")
const router = express.Router()
const jobCategoryControllers = require("../../controllers/JobCategory/jobCategory.controller")
const authMiddleware = require("../../middlewares/authMiddleware")
router.post("/create-category", jobCategoryControllers.createJobCategory)
router.get("/get-categories", jobCategoryControllers.getJobCategories)
router.post("/admin/get-categories", jobCategoryControllers.getJobCategoriesForAdmin)
router.get("/admin/sub-category/category", jobCategoryControllers.getJobCategoriesForSubCategoryForAdmin)
router.put("/update-category/:id", jobCategoryControllers.updateJobCategory)
router.delete("/delete-category/:id", jobCategoryControllers.deleteJobCategory)
router.post("/generate-job-categories", jobCategoryControllers.generateJobCategories)
router.post("/get-job-categories-for-filter", jobCategoryControllers.getJobCategoryForJobFilter)

module.exports = router