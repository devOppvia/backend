exports.successResponse = (res, data = {}, message, pagination)=>{
    return res.status(200).json({
        status : true,
        message,
        data,
        pagination 
    })
}

exports.errorResponse = (res, message = "Something went wrong", statusCode = 500)=>{
    return res.status(statusCode).json({
        status : false,
        message
    })
}