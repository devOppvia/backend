const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const validator = require("validator");

exports.getInternNotifications = async (req, res) => {
  try {
    let { internId } = req.params || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Intern id is invalid", 400);
    }
    let notifications = await prisma.internNotification.findMany({
      where: {
        internId: internId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        internId: true,
        title: true,
        message: true,
        createdAt: true,
      },
    });
    return successResponse(
      res,
      notifications,
      "Notifications fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
