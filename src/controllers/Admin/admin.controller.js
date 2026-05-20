const { errorResponse, successResponse } = require("../../utils/responseHeader")
const  adminServices = require("../../services/Admin/admin.service")

exports.getIncompleteProfileInterns = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1
        const limit = parseInt(req.body.limit) || 10
        const result = await adminServices.getIncompleteProfileInterns({ page, limit })
        return successResponse(res, result.data, "Incomplete profile interns fetched successfully", result.pagination)
    } catch (error) {
        console.error(error)
        return errorResponse(res, "Internal server error", 500)
    }
}

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