const prisma = require("../../config/database")
const { errorResponse, successResponse} = require("../../utils/responseHeader")
let validator = require("validator")


exports.getCompanyNotifications = async (req,res)=>{
    try {
        let { companyId } = req.params || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        let notifications = await prisma.notification.findMany({
            where : {
                companyId : companyId
            },
            orderBy : {
                createdAt : "desc"
            },
            select : {
                id : true,
                title : true,
                message : true,
                createdAt : true
            }
        })
        return successResponse(res, notifications, "Notifications fetched successfully", {}, 200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}