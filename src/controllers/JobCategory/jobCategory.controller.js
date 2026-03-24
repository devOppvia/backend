const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const jobCategoryServices = require("../../services/JobCategory/jobCategory.service");
const validator = require("validator");
const {
  generateCategoryPrompt,
} = require("../../helpers/generateJobAboutPrompt");
const { GenerateNewJobCategories } = require("../../helpers/geminiApi");
const prisma = require("../../config/database");

exports.createJobCategory = async (req, res) => {
  try {
    let { categoryName } = req.body || {};
    if (!categoryName) {
      return errorResponse(res, "Category name is required", 400);
    }
    categoryName = categoryName.trim();
    const nameRegex = /^[^\x00-\x1F\x7F]+$/;

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
        "Category name must not exceed 50 characters",
        400
      );
    }

    if (!nameRegex.test(categoryName)) {
      return errorResponse(
        res,
        "Category name contains invalid characters",
        400
      );
    }
    const normalizedInput = categoryName.replace(/\s+/g, "").toLowerCase();

    // Fetch all active categories for space-based & case-insensitive duplicate check
    const activeCategories = await prisma.jobCategory.findMany({
      where: { isDelete: false },
      select: { categoryName: true },
    });

    const isDuplicate = activeCategories.some(
      (cat) => cat.categoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (isDuplicate) {
      return errorResponse(res, "Category name already exists", 400);
    }

    // If a deleted category with same normalized name exists, restore it
    const deletedCategories = await prisma.jobCategory.findMany({
      where: { isDelete: true },
      select: { id: true, categoryName: true },
    });

    const deletedMatch = deletedCategories.find(
      (cat) => cat.categoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (deletedMatch) {
      await prisma.jobCategory.update({
        where: { id: deletedMatch.id },
        data: { categoryName, isDelete: false },
      });
    } else {
      await jobCategoryServices.createJobCategory(categoryName);
    }

    return successResponse(
      res,
      {},
      "Job Categories processed successfully",
      200
    );
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobCategories = async (req, res) => {
  try {
    let existingJobCategories = await jobCategoryServices.getJobCategories();
    return successResponse(
      res,
      existingJobCategories,
      "Categories fetched successfully",
      {},
      200
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobCategoriesForAdmin = async (req, res) => {
  try {
    let { currentPage = 1, itemsPerPage = 3 } = req.body || {};
    let existingJobCategories =
      await jobCategoryServices.getJobCategoriesForAdmin(
        currentPage,
        itemsPerPage
      );
    return successResponse(
      res,
      existingJobCategories,
      "Categories fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error)  
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobCategoriesForSubCategoryForAdmin = async (req, res) => {
  try {
    let existingJobCategories =
      await jobCategoryServices.getJobCategoriesForSubCategory();
    return successResponse(
      res,
      existingJobCategories,
      "Categories fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateJobCategory = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { categoryName } = req.body || {};
    if (!id) {
      return errorResponse(res, "Category id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid Category id format", 400);
    }
    if (!categoryName) {
      return errorResponse(res, "Category name is required", 400);
    }
    categoryName = categoryName.trim();
    const nameRegex = /^[^\x00-\x1F\x7F]+$/;

    if (!nameRegex.test(categoryName)) {
      return errorResponse(
        res,
        "Category name contains invalid characters",
        400
      );
    }
    if(categoryName.length < 3){
      return errorResponse(res, "Category name must be at least 3 characters long", 400)
    }
    if(categoryName.length > 50){
      return errorResponse(res, "Category name must not exceed 50 characters", 400)
    }
    let existingCategoryById = await jobCategoryServices.getJobCategory(id);
    if (!existingCategoryById) {
      return errorResponse(res, "Category not found", 400);
    }

    const normalizedInput = categoryName.replace(/\s+/g, "").toLowerCase();

    // Fetch all active categories except current for space-based & case-insensitive duplicate check
    const activeCategories = await prisma.jobCategory.findMany({
      where: { isDelete: false, NOT: { id } },
      select: { categoryName: true },
    });

    const isDuplicate = activeCategories.some(
      (cat) => cat.categoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );

    if (isDuplicate) {
      return errorResponse(res, "Category name already exists", 400);
    }

    await jobCategoryServices.updateJobCategory(id, categoryName);

    return successResponse(res, {}, "Category updated successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteJobCategory = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Category id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid Category id format", 400);
    }
    let existingCategory = await prisma.jobCategory.findFirst({
      where : {
        id : id
      }
    })
    if (!existingCategory) {
      return errorResponse(res, "Category not found", 400);
    }
    if (existingCategory.isDelete) {
      return errorResponse(res, "Category not found", 404);
    }
    await prisma.$transaction([
      prisma.skills.updateMany({
        where: { jobCategoryId: id },
        data: { isDelete: true },
      }),
      prisma.jobSubCategory.updateMany({
        where: { jobCategoryId: id },
        data: { isDelete: true },
      }),
      prisma.jobCategory.update({
        where: { id },
        data: { isDelete: true },
      }),
    ]);
    return successResponse(res, {}, "Category deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobCategoryForJobFilter = async (req, res) => {
  try {
    let { companyId, jobStatus, startDate, endDate } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (jobStatus) {
      let validStatus = [
        "REVIEW",
        "APPROVED",
        "PAUSED",
        "COMPLETED",
        "REJECTED",
        "DRAFT",
      ];
      if (!validStatus.includes(jobStatus)) {
        return errorResponse(res, "Invalid job status", 400);
      }
    }
    let existingCategory = await jobCategoryServices.getJobCategoryForJobFilter(
      companyId,
      jobStatus,
      startDate,
      endDate
    );
    return successResponse(
      res,
      existingCategory,
      "Categories fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", error);
  }
};

exports.generateJobCategories = async (req, res) => {
  try {
    let { userInput } = req.body || {};
    if (!userInput) {
      return errorResponse(res, "User input is required", 400);
    }
    let existingJobCategories =
      await jobCategoryServices.getJobCategoriesForPrompt();
    let categories = [];
    for (let categoryName of existingJobCategories) {
      categories.push(categoryName.categoryName);
    }
    let categoryPrompt = await generateCategoryPrompt(categories, userInput);
    let newCategories = await GenerateNewJobCategories(categoryPrompt);
    function cleanJsonOutput(text) {
      return text.replace(/```json|```/g, "").trim();
    }
    try {
      let cleanOutPut = cleanJsonOutput(newCategories);
      let categoriesArray = JSON.parse(cleanOutPut);
      return successResponse(
        res,
        categoriesArray,
        "Job Categories fetched successfully",
        {},
        200
      );
    } catch (error) {
      console.error(error);
      return errorResponse(res, "No suggetions", 400);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
