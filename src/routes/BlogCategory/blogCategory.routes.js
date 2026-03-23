const express = require("express")
const router = express.Router()
const { createBlogCategory,getBlogCategories,updateBlogCategoryById,deleteBlogCategoryById } = require("../../controllers/BlogCategory/blogCategory.controller")

router.post("/create-category", createBlogCategory)
router.get("/get-categories", getBlogCategories)
router.put("/update-category/:id", updateBlogCategoryById)
router.delete("/delete-category/:id", deleteBlogCategoryById)

module.exports = router