const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/responseHeader");
const prisma = require("../config/database");

const isAdmin = async(req, res, next) => {

try {
    const {id} = req?.user;
    if(!id){
        return errorResponse(res, "Invalid token", 401);
    }
    const admin = await prisma.admin.findUnique({
        where: {
            id: id
        }
    });
    if(!admin){
        return  res.status(404).json({
            status : false,
            message : "Admin not found",
            code : "INVALID_ADMIN",
            data : {}
        })
    }
    next();

} catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return errorResponse(res, "Internal server error", 500);
}
  
};

module.exports = isAdmin;
