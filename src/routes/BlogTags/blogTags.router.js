const express = require("express")
const router = express.Router()
const { createBlogTag,getAllBlogTags,updateBlogTagById,deleteBlogTagById } = require("../../controllers/BlogTags/blogTags.controller")

router.post("/create-tag", createBlogTag)
router.get("/get-all-tags", getAllBlogTags)
router.put("/update-tag/:id", updateBlogTagById)
router.delete("/delete-tag/:id", deleteBlogTagById)

module.exports = router