const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const jobSubCategoryServices = require("../../services/JobSubCategory/jobSubCategory.service");
const jobCategoryServices = require("../../services/JobCategory/jobCategory.service");
const validator = require("validator");
const {
  generateSubCategoryPrompt,
} = require("../../helpers/generateJobAboutPrompt");
const { GenerateNewJobSubCategory } = require("../../helpers/geminiApi");
const prisma = require("../../config/database");

exports.createJobSubCategory = async (req, res) => {
  try {
    let { subCategoryName, jobCategoryId } = req.body || {};
    subCategoryName = req.body.subCategoryName.subCategoryName;
    if (!subCategoryName) {
      return errorResponse(res, "SubCategory name is required", 400);
    }
    if (!Array.isArray(subCategoryName)) {
      return errorResponse(
        res,
        "SubCategory name must be in array format",
        400
      );
    }

    if (!jobCategoryId) {
      return errorResponse(res, "Job Category id is required", 400);
    }
    if (!validator.isUUID(jobCategoryId)) {
      return errorResponse(res, "Job Category id is not valid", 400);
    }
    if (!Array.isArray(subCategoryName) || subCategoryName.length === 0) {
      return errorResponse(res, "No subcategories provided", 400);
    }
    let existingJobCategory = await jobCategoryServices.getJobCategory(jobCategoryId)
    if(!existingJobCategory){
      return errorResponse(res, "Job category not found", 400)
    }
    const nameRegex = /^[^\x00-\x1F\x7F]+$/;

    // Validate each name upfront
    for (let name of subCategoryName) {
      name = name.trim();
      if (name.length < 3) {
        return errorResponse(res, `SubCategory name  must be at least 3 characters long`, 400);
      }
      if (name.length > 50) {
        return errorResponse(res, `SubCategory name must not exceed 50 characters`, 400);
      }
      if (!nameRegex.test(name)) {
        return errorResponse(res, `SubCategory name contains invalid characters`, 400);
      }
    }

    // Fetch active and deleted subcategories for this category once
    const activeSubCategories = await prisma.jobSubCategory.findMany({
      where: { jobCategoryId, isDelete: false },
      select: { subCategoryName: true },
    });
    const deletedSubCategories = await prisma.jobSubCategory.findMany({
      where: { jobCategoryId, isDelete: true },
      select: { id: true, subCategoryName: true },
    });

    for (let name of subCategoryName) {
      name = name.trim();
      const normalizedInput = name.replace(/\s+/g, "").toLowerCase();

      const isDuplicate = activeSubCategories.some(
        (s) => s.subCategoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
      );
      if (isDuplicate) {
        return errorResponse(res, `SubCategory "${name}" already exists`, 400);
      }

      const deletedMatch = deletedSubCategories.find(
        (s) => s.subCategoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
      );
      if (deletedMatch) {
        await prisma.jobSubCategory.update({
          where: { id: deletedMatch.id },
          data: { subCategoryName: name, isDelete: false },
        });
      } else {
        await jobSubCategoryServices.createJobSubCategory(name, jobCategoryId);
      }
    }

    return successResponse(res, {}, "Subcategories processed successfully", 200);
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getSubCategoriesBasedOnCategory = async (req, res) => {
  try {
    let { categoryIds } = req.body || {};
    if (!categoryIds) {
      return errorResponse(res, "Category id is required", 400);
    }
    if(!Array.isArray(categoryIds)){
      categoryIds = [categoryIds]
    }
    for (let categoryId of categoryIds) {
      if (!validator.isUUID(categoryId)) {
        return errorResponse(res, "Invalid category format", 400);
      }
    }
    let existingSubcategories = await prisma.jobSubCategory.findMany({
      where : {
        jobCategoryId : {
          in : categoryIds
        },
        isDelete : false,
        skills : {
          some : {
            isDelete : false
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        subCategoryName: true,
        createdAt: true,
        jobCategoryId: true,
      },
    })
    return successResponse(
      res,
      existingSubcategories,
      "SubCategories fetched successfully"
    );
  } catch (error) {
    console.error(error);
    
    return errorResponse(res, "Internal server error");
  }
};



exports.getJobSubCategoriesForAdmin = async (req, res) => {
  try {
    let { jobCategoryId, currentPage = 1, itemsPerPage = 3 } = req.body || {};
    if (jobCategoryId) {
    
      let existingSubCategory = await prisma.jobCategory.findUnique({
        where : {
          id : jobCategoryId
        }
      })
      if (!existingSubCategory) {
        return errorResponse(res, "Job Category not found", 400);
      }
    }
    let existingCategory =
      await jobSubCategoryServices.getJobSubCategoriesForAdmin(
        jobCategoryId,
        currentPage,
        itemsPerPage
      );
    return successResponse(
      res,
      existingCategory,
      "Categories fetched successfully",
      {},
      200
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobSubCategoriesForAdminSkills = async (req, res) => {
  try {
    let { jobCategoryId } = req.body || {};
    if (jobCategoryId) {
    
      let existingSubCategory = await prisma.jobCategory.findUnique({
        where : {
          id : jobCategoryId
        }
      })
      if (!existingSubCategory) {
        return errorResponse(res, "Job Category not found", 400);
      }
    }
    let existingCategory =
      await jobSubCategoryServices.getJobSubCategoriesForAdminSkills(
        jobCategoryId
      );
    return successResponse(
      res,
      existingCategory,
      "Categories fetched successfully",
      {},
      200
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateJobSubCategory = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { subCategoryName, jobCategoryId } = req.body || {};
    if (!id) {
      return errorResponse(res, "SubCategory id is required", 400);
    }
    if (!subCategoryName) {
      return errorResponse(res, "SubCategory name is required", 400);
    }
    subCategoryName = subCategoryName.trim();
    if (subCategoryName.length < 3) {
      return errorResponse(
        res,
        "SubCategory name should be at least 3 characters long",
        400
      );
    }
    if (subCategoryName.length > 50) {
      return errorResponse(
        res,
        "SubCategory name should be less than 50 characters long",
        400
      );
    }
    const nameRegex = /^[^\x00-\x1F\x7F]+$/;
    if (!nameRegex.test(subCategoryName)) {
      return errorResponse(
        res,
        "SubCategory name contains invalid characters",
        400
      );
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Job Category id is required", 400);
    }
    let existingSubCategoryById =
      await jobSubCategoryServices.getSubCategoryBasedOnId(id);
    if (!existingSubCategoryById) {
      return errorResponse(res, "SubCategory not found", 400);
    }

    const normalizedInput = subCategoryName.replace(/\s+/g, "").toLowerCase();

    // Fetch all active subcategories except current for space-based & case-insensitive duplicate check
    const activeSubCategories = await prisma.jobSubCategory.findMany({
      where: { isDelete: false, NOT: { id } },
      select: { subCategoryName: true },
    });

    const isDuplicate = activeSubCategories.some(
      (s) => s.subCategoryName.replace(/\s+/g, "").toLowerCase() === normalizedInput
    );
    if (isDuplicate) {
      return errorResponse(res, "SubCategory name already exists", 400);
    }

    await jobSubCategoryServices.updateJobSubCategory(
      id,
      subCategoryName,
      jobCategoryId
    );
    return successResponse(res, {}, "SubCategory updated successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteJobSubCategory = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "SubCategory id is required", 400);
    }
    let existingSubCategory =
      await jobSubCategoryServices.getSubCategoryBasedOnId(id);
    if (!existingSubCategory) {
      return errorResponse(res, "SubCategory not found", 400);
    }
    if (existingSubCategory.isDelete) {
      return errorResponse(res, "SubCategory not found", 404);
    }
    await prisma.$transaction([
      prisma.skills.updateMany({
        where: { jobSubCategoryId: id },
        data: { isDelete: true },
      }),
      prisma.jobSubCategory.update({
        where: { id },
        data: { isDelete: true },
      }),
    ]);
    return successResponse(res, {}, "SubCategory deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getJobSubCategoryForJobFilter = async (req, res) => {
  try {
    let { companyId, jobCategoryId, jobStatus, startDate, endDate } =
      req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Job Category id is required", 400);
    }
    if(!validator.isUUID(companyId)){
      return errorResponse(res, "Invalid company id", 400)
    }
    if (!validator.isUUID(jobCategoryId)) {
      return errorResponse(res, "Invalid job category id", 400);
    }
    if (jobStatus) {
      let validJobStatus = [
        "REVIEW",
        "APPROVED",
        "PAUSED",
        "COMPLETED",
        "REJECTED",
        "DRAFT",
      ];
      if (!validJobStatus.includes(jobStatus)) {
        return errorResponse(res, "Invalid job status", 400);
      }
    }
    let existingJobSubCategory =
      await jobSubCategoryServices.getJobSubCategoryForJobFilter(
        companyId,
        jobCategoryId,
        jobStatus,
        startDate,
        endDate
      );
    return successResponse(
      res,
      existingJobSubCategory,
      "Job SubCategories fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.generateSubCategoriesFromAi = async (req, res) => {
  try {
    let { jobCategoryId, userInput = "Web Development" } = req.body || {};
    if (!jobCategoryId) {
      return errorResponse(res, "Job category id is required", 400);
    }
    if (!validator.isUUID(jobCategoryId)) {
      return errorResponse(res, "Invalid job category id", 400);
    }
    
    let jobCategory = await jobCategoryServices.getJobCategory(
      jobCategoryId
    );
    if (!jobCategory) {
      return errorResponse(res, "Job Category not found", 404);
    }
    let { categoryName } = jobCategory;
    let existingSubCategories =
      await jobSubCategoryServices.getJobSubCategoriesForPrompt(jobCategoryId);
    let subCategories = [];
    for (let category of existingSubCategories) {
      subCategories.push(category.subCategoryName);
    }
    let prompt = await generateSubCategoryPrompt(
      categoryName,
      subCategories,
      userInput
    );

    let generatedSubCategories;

    try {
      generatedSubCategories = await GenerateNewJobSubCategory(prompt);
      function cleanJsonOutput(text) {
        return text.replace(/```json|```/g, "").trim();
      }

      let cleanOutPut = cleanJsonOutput(generatedSubCategories);
      let categoriesArray = JSON.parse(cleanOutPut);

      if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
        return errorResponse(
          res,
          "No Suggestions available",
          400
        );
      }

      return successResponse(
        res,
        categoriesArray,
        "SubCategories generated successfully",
        {},
        200
      );
    } catch (error) {
      console.error("Gemini API Error:", error.message);

      return errorResponse(
        res,
        "No Suggestions available due to API limit or error",
        400
      );
    }
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
