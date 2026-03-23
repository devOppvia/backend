const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");

exports.createBlogCategory = async (req, res) => {
  try {
    let { categoryName } = req.body || {};
    if (!categoryName) {
      return errorResponse(res, "Category name is required", 400);
    }
    categoryName = categoryName.trim();
    if (categoryName.length < 3) {
      return errorResponse(
        res,
        "Category name must be at least 3 characters long",
        400
      );
    }
    if (categoryName.length > 50) {
      return errorResponse(
        res,
        "Category name must be less than 50 characters long",
        400
      );
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(categoryName)) {
      return errorResponse(
        res,
        "Category name must contain only alphabetic characters",
        400
      );
    }

    // Normalize input: remove spaces and lowercase for duplicate comparison
    const normalizedInput = categoryName.replace(/\s+/g, "").toLowerCase();

    // Fetch all active (non-deleted) categories to check for duplicates
    const activeCategories = await prisma.blogCategory.findMany({
      where: { isDelete: false },
      select: { categoryName: true },
    });

    const isDuplicate = activeCategories.some(
      (cat) => cat.categoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (isDuplicate) {
      return errorResponse(res, "Category name already exists", 400);
    }

    // Check if a deleted category with the same normalized name exists — restore it instead of creating
    const allCategories = await prisma.blogCategory.findMany({
      where: { isDelete: true },
      select: { id: true, categoryName: true },
    });

    const deletedMatch = allCategories.find(
      (cat) => cat.categoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (deletedMatch) {
      await prisma.blogCategory.update({
        where: { id: deletedMatch.id },
        data: { categoryName: categoryName, isDelete: false },
      });
    } else {
      await prisma.blogCategory.create({
        data: { categoryName: categoryName },
      });
    }

    return successResponse(res, {}, "Category created successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getBlogCategories = async (req, res) => {
  try {
    let existingCategories = await prisma.blogCategory.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        categoryName: true,
        createdAt: true,
      },
      where: {
        isDelete: false,
      },
    });

    return successResponse(
      res,
      existingCategories,
      "Categories fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateBlogCategoryById = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { categoryName } = req.body || {};
    if (!id) {
      return errorResponse(res, "Category id is required", 400);
    }
    if (!categoryName) {
      return errorResponse(res, "Category name is required", 400);
    }
    categoryName = categoryName.trim();

    if (categoryName.length < 3) {
      return errorResponse(
        res,
        "Category name must be at least 3 characters long",
        400
      );
    }
    if (categoryName.length > 50) {
      return errorResponse(
        res,
        "Category name must be less than 50 characters long",
        400
      );
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(categoryName)) {
      return errorResponse(
        res,
        "Category name must contain only letters and spaces",
        400
      );
    }

    let existingCategoryId = await prisma.blogCategory.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingCategoryId) {
      return errorResponse(res, "Category id does not exist", 400);
    }
    let whereClause = {
      categoryName: categoryName,
    };
    if (id) {
      whereClause.id = {
        not: id,
      };
    }

    let existingCategory = await prisma.blogCategory.findFirst({
      where: whereClause,
    });

    if (existingCategory) {
      return errorResponse(res, "Category name already exists", 400);
    }
    let existingCategoryName = await prisma.blogCategory.findFirst({
      where: {
        categoryName: {
          startsWith: categoryName,
          mode: "insensitive",
        },
        id: {
          not: id,
        },
      },
    });

    if (existingCategoryName) {
      return errorResponse(res, "Category name already exists", 400);
    }
    await prisma.blogCategory.update({
      where: {
        id: id,
      },
      data: {
        categoryName: categoryName,
      },
    });
    return successResponse(res, {}, "Category updated successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteBlogCategoryById = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Category id is required", 400);
    }
    let existingCategoryId = await prisma.blogCategory.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingCategoryId) {
      return errorResponse(res, "Category id does not exist", 400);
    }

    await prisma.blogCategory.update({
      where: {
        id: id,
      },
      data: {
        isDelete: true,
      },
    });
    return successResponse(res, {}, "Category deleted successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
