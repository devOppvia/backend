const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const userManagementServices = require("../../services/UserManagement/userManagement.service");
const path = require("path")

exports.studentRegistration = async (req, res) => {
  try {
    let {
      name,
      age,
      location,
      college,
      course,
      yearOfStudy,
      skills,
      interests,
      interesetedIn,
    } = req.body || {};
    
    
    let { resume } = req.files || {};
    if(!resume){
        return errorResponse(res, "Resume is required", 400)
    }
    
    if(path.extname(resume[0].originalname).toLowerCase() !== ".pdf"){
        return errorResponse(res, "Resume must be in pdf format", 400)
    }
    if(!name){
        return errorResponse(res, "Name is required", 400)
    }
    if(!age){
        return errorResponse(res, "Age is required", 400)
    }
    if(!location){
        return errorResponse(res, "Location is required", 400)
    }
    if(!college){
        return errorResponse(res, "College is required", 400)
    }
    if(!course){
        return errorResponse(res, "Course is required", 400)
    }
    if(!yearOfStudy){
        return errorResponse(res, "Year of study is required", 400)
    }
    if(!skills){
        return errorResponse(res, "Skills is required", 400)
    }
    if(!Array.isArray(skills)){
        return errorResponse(res, "Skills must be an array", 400)
    }
    if(!interests){
        return errorResponse(res, "Interests is required", 400)
    }
    if(!interesetedIn){
        return errorResponse(res, "Interested in is required", 400)
    }
    age = parseInt(age)
    await userManagementServices.studentRegistration(name,age,location,college,course,yearOfStudy,skills,interests,interesetedIn,resume = resume[0].filename)
    return successResponse(res, {}, "Student registered successfully")
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getStudentDetailsByStatus = async (req, res)=>{
    try {
        let { status } = req.body || {}
        if(status){
            let validStatus = ["PENDING", "APPROVED", "REJECTED"]
            if(!validStatus.includes(status)){
                return errorResponse(res, "Enter a valid status", 400)
            }
        }
        let studentDetails = await userManagementServices.getAllStudentsByStatus(status)
        return successResponse(res, studentDetails, "Student details fetched successfully")
    } catch (error) {
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.updateStudentStatus = async (req, res)=>{
    try {
        let { id } = req.params || {}
        let { status } = req.body || {}
        if(!id){
            return errorResponse(res, "Id is required", 400)
        }
        if(!status){
            return errorResponse(res, "Status is required", 400)
        }
        if(status){
            let validStatus = ["PENDING", "APPROVED", "REJECTED"]
            if(!validStatus.includes(status)){
                return errorResponse(res, "Enter a valid status", 400)
            }
        }
        let existingStudent = await userManagementServices.getStudentById(id)
        if(!existingStudent){
            return errorResponse(res, "Student not found", 400)
        }
        await userManagementServices.updateStudentStatus(id, status)
        return successResponse(res, {}, "Student status updated successfully")
    } catch (error) {
        return errorResponse(res, "Internal server error", 500)
    }
}

exports.deleteStudentDetails = async (req, res)=>{
    try {
        let { id } = req.params || {}
        if(!id){
            return errorResponse(res, "Id is required", 400)
        }
        let existingStudent = await userManagementServices.getStudentById(id)
        if(!existingStudent){
            return errorResponse(res, "Student not found", 400)
        }
        await userManagementServices.deleteStudentDetails(id)
        return successResponse(res, {}, "Student details deleted successfully")
    } catch (error) {
        return errorResponse(res, "Internal server error", 500)
    }
}
