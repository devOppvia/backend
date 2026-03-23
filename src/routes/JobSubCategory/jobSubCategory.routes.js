const express = require("express")
const router = express.Router()
const jobSubCategoryController = require("../../controllers/JobSubCategory/jobSubCategory.controller")
const authMiddleware = require("../../middlewares/authMiddleware")
router.post("/create-subCategory", jobSubCategoryController.createJobSubCategory)
router.post("/get-subCategories",jobSubCategoryController.getSubCategoriesBasedOnCategory);
router.post("/admin/get-subCategories",jobSubCategoryController.getJobSubCategoriesForAdmin);
router.post("/admin/skills/sub-categories", jobSubCategoryController.getJobSubCategoriesForAdminSkills)
router.put("/update-subCategory/:id",jobSubCategoryController.updateJobSubCategory);
router.delete("/delete-subCategory/:id", jobSubCategoryController.deleteJobSubCategory);
router.post("/generate-sub-categories", jobSubCategoryController.generateSubCategoriesFromAi)
router.post("/get-jobSubCategories-for-filter", jobSubCategoryController.getJobSubCategoryForJobFilter)


module.exports = router