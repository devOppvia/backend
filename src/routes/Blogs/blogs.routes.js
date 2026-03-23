const express = require("express")
const router = express.Router()
const { createBlog,getAllBlogs,deleteBlogById,updateBlog,getAllBlogsAdmin } = require("../../controllers/Blogs/blogs.controller")
const multer = require("multer")
const storage = multer.diskStorage({
    destination : "uploads/",
    filename : function(req, file, cb){
        const uniqueFilename = `${Date.now()}-${file.originalname}`
        cb(null, uniqueFilename)
    }
})
const uploads = multer({ storage : storage})
router.post("/create-blog",uploads.fields([{ name : "image"}]), createBlog)
router.post("/get-all-blogs", getAllBlogs)
router.post("/get-all-blogs-admin", getAllBlogsAdmin)
router.put("/update-blog/:id", uploads.fields([{ name : "image"}]), updateBlog)
router.delete("/delete-blog/:id", deleteBlogById)

module.exports = router