const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");

exports.createContactUs = async (req, res) => {
  try {
    let { fullName, email, country, phoneNumber, reason, message } =
      req.body || {};
    if (!fullName || fullName.trim() === "") {
      return errorResponse(res, "Full name is required", 400);
    }
    if (!email || email.trim() === "") {
      return errorResponse(res, "Email is required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    if (!country || country.trim() === "") {
      return errorResponse(res, "Country is required", 400);
    }
    if (!phoneNumber || phoneNumber.trim() === "") {
      return errorResponse(res, "Phone number is required", 400);
    }
    const phoneRegex = /^[+]?[\d\s-]{7,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return errorResponse(res, "Invalid phone number format", 400);
    }
    if (!reason || reason.trim() === "") {
      return errorResponse(res, "Reason is required", 400);
    }
    if (!message || message.trim() === "") {
      return errorResponse(res, "Message is required", 400);
    }
    await prisma.contactUs.create({
      data: {
        fullName,
        email,
        country,
        phoneNumber,
        reason,
        message,
      },
    });
    return successResponse(res, {}, "Contact us created successfully", {}, 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);  
  }
};

exports.getAllContactUs = async (req, res) => {
  try {
    let existingContactUs = await prisma.contactUs.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        country: true,
        phoneNumber: true,
        reason: true,
        message: true,
        createdAt: true,
      },
    });
    return successResponse(
      res,
      existingContactUs,
      "Contact us fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
