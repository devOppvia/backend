const { errorResponse, successResponse } = require("../../utils/responseHeader")
const companyDashboardServices = require("../../services/CompanyDashboard/companyDashboard.service")
const validator = require("validator")
const getAvatarPath = require("../../helpers/static_avatar_path")

exports.getCompanyDashboardDetails = async (req,res)=>{
    try {
        let { companyId } = req.body || {}
        if(!companyId){
            return errorResponse(res,"Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Company id is invalid", 400)
        }
        let response = await companyDashboardServices.getCompanyDashboardDetails(companyId)
        return successResponse(res, response, "Dashboard details fetched successfully",{} ,200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.getCompanyDashboardCandidateDetails = async (req,res)=>{
    try {
        
        let { companyId, candidateStatus = "SHORTLISTED" } = req.body || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        if(!candidateStatus){
            return errorResponse(res, "Candidate status is required", 400)
        }
        if(candidateStatus){
            let validStatus = ["SHORTLISTED","REVIEW","INTERVIEW","HIRED","REJECTED"]
            if(!validStatus.includes(candidateStatus)){
                return errorResponse(res, "Invalid status",400)
            }
        }
        let result = await companyDashboardServices.getCompanyDashboardCandidateDetails(companyId,candidateStatus)
        
        return successResponse(res, result, "Candidate details fetched successfully",{},200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.getCompanyDashboardJobDetails = async (req, res)=>{
    try {
        let { companyId } = req.body || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        let result = await companyDashboardServices.getCompanyDashboardJobDetails(companyId)
        return successResponse(res, result, "job details fetched successfully",{},200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}


exports.getCompanyDashboardRecentAppliedDetails = async (req,res)=>{
    try {
        let { companyId } = req.body || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        let result = await companyDashboardServices.getCompanyDashboardRecentAppliedDetails(companyId)
        for(let internDetail of result){
            let { profilePicture, gender } = internDetail.intern || {}
            if(!profilePicture){
                let profilePicuture = await getAvatarPath(gender)
                internDetail.intern.profilePicture = profilePicuture
            }
        }
        return successResponse(res, result, "candidate details fetched successfully",{},200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.getJobCountStatus = async (req,res) => {
     try {
        let { companyId } = req.body || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        let result = await companyDashboardServices.getJobByStatus(companyId)
       
        return successResponse(res, result, "candidate details fetched successfully",{},200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.getAllInterviews = async (req, res) => {
    try {
        let { companyId } = req.body || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        let result = await companyDashboardServices.getAllInterviewsByCompanyId(companyId)
        
        return successResponse(res, result, "Interviews fetched successfully",{},200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.getCompanyCreditsAndStats = async (req, res) => {
    try {
        let { companyId } = req.body || {}
        if(!companyId){
            return errorResponse(res, "Company id is required", 400)
        }
        if(!validator.isUUID(companyId)){
            return errorResponse(res, "Invalid company id", 400)
        }
        let result = await companyDashboardServices.getCompanyCreditsAndStats(companyId)
        
        return successResponse(res, result, "Company credits and stats fetched successfully",{},200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}