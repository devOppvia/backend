const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");

exports.createBlogTag = async (req, res) => {
  try {
    let { tagName } = req.body || {};
    if (!tagName) {
      return errorResponse(res, "Tag name is required", 400);
    }
    tagName = tagName.trim();
    if (tagName.length < 3) {
      return errorResponse(
        res,
        "Tag name must be at least 3 characters long",
        400
      );
    }
    if (tagName.length > 20) {
      return errorResponse(
        res,
        "Tag name must be at most 20 characters long",
        400
      );
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(tagName)) {
      return errorResponse(
        res,
        "Tag name must contain only alphabetic characters",
        400
      );
    }

    // Normalize: remove spaces and lowercase for duplicate comparison
    const normalizedInput = tagName.replace(/\s+/g, "").toLowerCase();

    // Check active (non-deleted) tags for case-insensitive and space-based duplicates
    const activeTags = await prisma.blogTag.findMany({
      where: { isDelete: false },
      select: { tagName: true },
    });

    const isDuplicate = activeTags.some(
      (tag) => tag.tagName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (isDuplicate) {
      return errorResponse(res, "Tag name already exists", 400);
    }

    // If a deleted tag with same normalized name exists, restore it instead of creating
    const deletedTags = await prisma.blogTag.findMany({
      where: { isDelete: true },
      select: { id: true, tagName: true },
    });

    const deletedMatch = deletedTags.find(
      (tag) => tag.tagName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (deletedMatch) {
      await prisma.blogTag.update({
        where: { id: deletedMatch.id },
        data: { tagName: tagName, isDelete: false },
      });
    } else {
      await prisma.blogTag.create({
        data: { tagName: tagName },
      });
    }

    return successResponse(res, {}, "Tag created successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllBlogTags = async (req, res) => {
  try {
    let existingTags = await prisma.blogTag.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        tagName: true,
        createdAt: true,
      },
      where: {
        isDelete: false,
      },
    });

    return successResponse(
      res,
      existingTags,
      "Tags fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateBlogTagById = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { tagName } = req.body || {};
    if (!tagName) {
      return errorResponse(res, "Tag name is required", 400);
    }
    if (!id) {
      return errorResponse(res, "Tag id is required", 400);
    }
    tagName = tagName.trim();
    if (tagName.length < 3) {
      return errorResponse(
        res,
        "Tag name must be at least 3 characters long",
        400
      );
    }
    if (tagName.length > 20) {
      return errorResponse(
        res,
        "Tag name must be at most 20 characters long",
        400
      );
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(tagName)) {
      return errorResponse(
        res,
        "Tag name must contain only letters and spaces",
        400
      );
    }
    let existingTag = await prisma.blogTag.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingTag) {
      return errorResponse(res, "Tag not found", 400);
    }
    let existingTagByName = await prisma.blogTag.findFirst({
      where: {
        tagName: tagName,
        id: {
          not: id,
        },
      },
    });

    if (existingTagByName) {
      return errorResponse(res, "Tag name already exists 1", 400);
    }
    let existingTagByNameRegex = await prisma.blogTag.findFirst({
      where: {
        tagName: {
          startsWith: tagName,
          mode: "insensitive",
        },
        id: {
          not: id,
        },
      },
    });

    if (existingTagByNameRegex) {
      return errorResponse(res, "Tag name already exists", 400);
    }
    await prisma.blogTag.update({
      where: {
        id: id,
      },
      data: {
        tagName: tagName,
      },
    });

    return successResponse(res, {}, "Tag updated successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteBlogTagById = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Tag id is required", 400);
    }
    let existingTag = await prisma.blogTag.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingTag) {
      return errorResponse(res, "Tag not found", 400);
    }
    await prisma.blogTag.update({
      where: {
        id: id,
      },
      data: {
        isDelete: true,
      },
    });

    return successResponse(res, {},"Tag deleted successfully",{}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
