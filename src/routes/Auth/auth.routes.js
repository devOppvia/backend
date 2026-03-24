const express = require("express")
const router = express.Router()
const authControllers = require("../../controllers/Auth/auth.controller")
const authMiddleware = require("../../middlewares/authMiddleware")
const isAdmin = require("../../middlewares/isAdminMiddleware")

router.post("/create-admin", authMiddleware,isAdmin ,authControllers.createAdmin)
router.get("/get-all-admins",authMiddleware,isAdmin, authControllers.getAllAdmins)
router.get("/fetch-company-details/:companyId", authControllers.getCompantDetails)
router.put("/update-admin/:id",authMiddleware,isAdmin, authControllers.updateAdmin)
router.delete("/delete-admin/:id",authMiddleware,isAdmin, authControllers.deleteAdmin)
router.post("/admin-login", authControllers.adminPanelLogin)
router.put("/change-password",authMiddleware,isAdmin, authControllers.changeAdminPassword)
router.post("/refresh-token", authControllers.refreshToken);

module.exports = router 