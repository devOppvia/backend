const express = require("express")
const router = express.Router()
const subscriptionController = require("../../controllers/Subscription/subscription.controller")



router.post("/create-subscription-plan", subscriptionController.createSubscriptionPlan)
router.get("/get-subscription-plan", subscriptionController.getAllSubscriptions)
router.get("/admin/get-subscriptions", subscriptionController.getSubscriptionPlanForAdmin)
router.get("/company/get-subscription-credits/:companyId", subscriptionController.getSubscriptionCreditsByCompany)
router.put("/admin/update-subscription-plan/:id", subscriptionController.updateSubscriptionPlan)
router.delete("/admin/delete-subscription-plan/:id", subscriptionController.deleteSubscriptionPlan)

router.post("/company/proceed-to-checkout", subscriptionController.proceedToCheckout)
router.post("/company/verify-payment", subscriptionController.verifyPayment)
router.get("/company/get-purchased-subscriptions/:companyId", subscriptionController.getPurchasedSubscriptionPackages)
router.get("/company/get-packages-job-post/:companyId", subscriptionController.getPurchasedSubscriptionPackagesForPostJob)
router.get("/company/get-subscription-packages/:companyId", subscriptionController.getSubscriptionPackagesForCompany)

router.get("/company/payment-history/:companyId", subscriptionController.getPaymentHistory)
module.exports = router