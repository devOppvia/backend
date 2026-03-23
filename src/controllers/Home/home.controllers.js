const prisma = require("../../config/database")
const { errorResponse, successResponse } = require("../../utils/responseHeader")

exports.getHomePageJobs = async (req, res)=>{
    try {
        let { } = req.body || {}
        let existingOpenings = await prisma.job.findMany({
            where : {
                jobStatus : "APPROVED",
                isDelete : false
            },
            take : 8,
            select : {
                id : true,
                skills : true,
                jobTitle : true,
                jobCategory : {
                    select : {
                        categoryName : true
                    }
                },
                jobSubCategory : {
                    select : {
                        subCategoryName : true
                    }
                },
                location : true,
                numberOfOpenings :true,
                stipend : true,
                minStipend : true,
                maxStipend : true,
                internshipDuration : true,
                jobType : true,
                company : {
                    select : {
                        companyName : true,
                        smallLogo : true,
                        id : true
                    }
                }
            }
        })
        return successResponse(res, existingOpenings, "Jobs fetched successfully", {}, 200)
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Internal server error", 500)
    }
}