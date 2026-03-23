exports.errorMiddleware = (err, req, res, next)=>{
    res.status(500).json({ error : err.message || "Server error"})
}