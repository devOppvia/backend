const { errorResponse, successResponse } = require("../../utils/responseHeader")
const  adminServices = require("../../services/Admin/admin.service")

exports.getDashboardDetails = async (req, res)=>{
    try {
        let { } = req.body || {}
        let result = await adminServices.getDashboardDetails()
        return successResponse(res, result, "Dashboard details fetched successfully ===",{})
    } catch (error) {
        console.error(error);
        
        return errorResponse(res, "Internal server error", 500)
    }
}