const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const supportServices = require("../../services/Support/support.service");
const validateEmail = require("../../validations/validateEmail")
const validator = require("validator")
const { getIo, users, admins,companyConnections } = require("../../socket/socket");
const io = getIo()
const prisma = require("../../config/database")

exports.createSupport = async (req, res) => {
  try {
    let {
      email,
      fullName,
      companyId,
      ticketType,
      phoneNumber,
      countryCode,
      subject,
      message,
    } = req.body || {};
    let { attachment } = req.files || {}
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!fullName) {
      return errorResponse(res, "Fullname is required", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if(!validator.isUUID(companyId)){
      return errorResponse(res, "Invalid company id", 400)
    }
    if(!ticketType){
      return errorResponse(res, "Ticket type is required", 400)
    }
    if (!phoneNumber) {
      return errorResponse(res, "Phone number is required", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!/^\d+$/.test(phoneNumber)) {
      return errorResponse(res, "Phone number must contain only digits", 400);
    }
    if (countryCode === "+86") {
      if (!/^\d{11}$/.test(phoneNumber)) {
        return errorResponse(res, "Phone number must be 11 digits for country code +86", 400);
      }
    } else {
      if (!/^\d{10}$/.test(phoneNumber)) {
        return errorResponse(res, "Phone number must be 10 digits for this country", 400);
      }
    }
    if (!subject) {
      return errorResponse(res, "Subject is required", 400);
    }
    subject = subject.trim()
    if (subject.length > 150) {
      return errorResponse(res, "Subject can have a maximum of 150 characters", 400);
    }    
    if (!message) {
      return errorResponse(res, "Message is required", 400);
    }
    if (message.length > 2000) {
      return errorResponse(res, "Message can have a maximum of 2000 characters", 400);
    }    
    console.log("data is ====> : " , {   email: email,
        fullName: fullName,
        companyId: companyId,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        ticketType: ticketType,
        subject: subject,
        message: message,
        attachment: attachment?.[0]?.filename,})
    
    const support = await prisma.support.create({
      data: {
        email: email,
        fullName: fullName,
        companyId: companyId,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        ticketType: ticketType,
        subject: subject,
        message: message,
        attachment: attachment?.[0]?.filename,
      },
    });
    await prisma.supportMessages.create({
      data: {
        supportId: support.id,
        message: message,
        attachment: attachment?.[0].filename,
      },
    });
    
    admins.forEach((adminSocketId) => {
      io?.to(adminSocketId).emit("new_support_ticket", support);    
    });

    // Notify company
    const companySockets = companyConnections[companyId] || [];
    companySockets.forEach((sid) => {
      io?.to(sid).emit("ticket_created", support);
    });
    return successResponse(res, support, "Support created successfully", 201);
  } catch (error) {
    console.error(error);
    
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllCompanySupport = async (req, res) => {
  try {
    let { companyId, search = "", selectedDate } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if(!validator.isUUID(companyId)){
      return errorResponse(res, "Invalid company id", 400)
    }

    let support = await prisma.support.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                {
                  subject: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  ticketType: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(selectedDate
          ? {
              createdAt: {
                gte: new Date(selectedDate),
                lte: new Date(selectedDate),
              },
            }
          : {}),
      },
      select: {
        id: true,
        companyId: true,
        subject: true,
        ticketType: true,
        status: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        countryCode: true,
        isRepliedByAdmin: true,
        message: true,
        attachment: true,
        createdAt: true,
        updatedAt: true,
        support_messages: {
          select: {
            id: true,
            message: true,
            createAt: true,
            isRepliedByAdmin: true,
            attachment: true,
          },
          orderBy: {
            createAt: "desc",
          },
          take: 1,
        },
      },
    });
  
    support.sort((a, b) => {
      const aDate = a.support_messages[0]?.createAt
        ? new Date(a.support_messages[0].createAt)
        : new Date(a.createdAt);
      const bDate = b.support_messages[0]?.createAt
        ? new Date(b.support_messages[0].createAt)
        : new Date(b.createdAt);
      return bDate - aDate;
    });
    return successResponse(res, support, "Support fetched successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllCompanySupportForAdmin = async (req, res) => {
  try {
    let { search = "",selectedDate } = req.body || {};

    let support = await prisma.support.findMany({
      where: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
        ...(selectedDate
         ? {
              createdAt: {
                gte: new Date(selectedDate),
                lte: new Date(selectedDate),
              },
            }
          : {}),
      },
      select: {
        companyId: true,
        countryCode: true,
        createdAt: true,
        email: true,
        fullName: true,
        id: true,
        isRepliedByAdmin: true,
        message: true,
        phoneNumber: true,
        attachment: true,
        ticketType: true,
        status: true,
        subject: true,
        company: {
          select: {
            companyName: true,
            logo: true,
          },
        },
        support_messages: {
          select: {
            id: true,
            message: true,
            createAt: true,
            isRepliedByAdmin: true,
            attachment: true,
          },
          orderBy: {
            createAt: "desc",
          },
          take: 1,
        },
      },
    });
  
    support.sort((a, b) => {
      const aDate = a.support_messages[0]?.createAt
        ? new Date(a.support_messages[0].createAt)
        : new Date(a.createdAt);
      const bDate = b.support_messages[0]?.createAt
        ? new Date(b.support_messages[0].createAt)
        : new Date(b.createdAt);
      return bDate - aDate;
    });
    return successResponse(res, support, "Support fetched successfully", 200);
  } catch (error) {
    console.error(error);
    
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllCompanySupportMessages = async (req, res) => {
  try {
    let { supportId } = req.body || {};
    if (!supportId) {
      return errorResponse(res, "Support id is required", 400);
    }
    if(!validator.isUUID(supportId)){
      return errorResponse(res, "Invalid support id", 400)
    }
    let supportMessages = await prisma.supportMessages.findMany({
      where: {
        supportId: supportId,
      },
    });
    let customer_support = await prisma.support.findUnique({
      where: {
        id: supportId,
      },
    });
 
    const customerName = customer_support?.fullName;
    supportMessages.forEach((message) => {
      if (typeof message === "object") {
        message.customerName = customerName;
      }
    });
    
    return successResponse(
      res,
      supportMessages,
      "Support fetched successfully",
      200
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.addMessageToSupport = async (req, res) => {
  try {
    let { supportId, message, isRepliedByAdmin = false } = req.body || {};
    let { attachment } = req.files || {};

    const newMsg = await prisma.supportMessages.create({
      data: {
        message,
        supportId,
        isRepliedByAdmin : Boolean(isRepliedByAdmin),
        attachment: attachment?.[0]?.filename,
      },
    });

    // 🔥 EMIT REAL-TIME MESSAGE
    const io = getIo();
    io.to(supportId).emit("new_message", newMsg);

    return successResponse(res, newMsg, "Message added successfully", 200);
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.closeSupport = async (req, res) => {
  try {
    let { supportId } = req.body || {};
    if (!supportId) {
      return errorResponse(res, "Support id is required", 400);
    }
    let existingSupport = await prisma.support.findUnique({
      where: {
        id: supportId,
      },
    });
    if (!existingSupport) {
      return errorResponse(res, "Support not found", 404);
    }
    await prisma.support.update({
      where: {
        id: supportId,
      },
      data: {
        status: "CLOSED",
      },
    });
    return successResponse(res, {}, "Support closed successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};
