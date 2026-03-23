const express = require("express")
const router = express.Router()
const authControllers = require("../../controllers/Auth/auth.controller")

router.post("/create-admin", authControllers.createAdmin)
router.get("/get-all-admins", authControllers.getAllAdmins)
router.get("/fetch-company-details/:companyId", authControllers.getCompantDetails)
router.put("/update-admin/:id", authControllers.updateAdmin)
router.delete("/delete-admin/:id", authControllers.deleteAdmin)
router.post("/admin-login", authControllers.adminPanelLogin)
router.put("/change-password", authControllers.changeAdminPassword)
router.post("/refresh-token", authControllers.refreshToken);

module.exports = router