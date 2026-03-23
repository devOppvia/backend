const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/responseHeader");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return errorResponse(res, "No token provided", 401);
  }


  const token = authHeader.split(" ")[1];
  if (!token) {
    return errorResponse(res, "Invalid token format", 401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return errorResponse(res, "Invalid or expired token", 401);
    }


    console.log("auth token decoded" , decoded)
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
