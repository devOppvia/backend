const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const skillsServices = require("../../services/Skills/skills.service");
const jobCategoryServices = require("../../services/JobCategory/jobCategory.service");
const jobSubCategoryServices = require("../../services/JobSubCategory/jobSubCategory.service");
const axios = require("axios");
const validator = require("validator");
const {
  generateSkillsPrompt,
} = require("../../helpers/generateJobAboutPrompt");
const prisma = require("../../config/database");
const { generateSkillsAI } = require("../../helpers/openAi");
exports.createSkill = async (req, res) => {
  try {
    let { skillName, jobCategoryId, jobSubCategoryId } = req.body || {};

    if (!skillName) {
      return errorResponse(res, "Skill name is required", 400);
    }

    const onlySpecialChars = /^[^a-zA-Z0-9]+$/;

    if (!jobCategoryId) {
      return errorResponse(res, "Category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "SubCategory id is required", 400);
    }
    if (!Array.isArray(skillName)) {
      return errorResponse(res, "Skill name must in array format", 400);
    }
    if (skillName.length === 0) {
      return errorResponse(res, "Select atleast one skill", 400);
    }

    let existingCategory = await prisma.jobCategory.findUnique({
      where: {
        id: jobCategoryId,
      },
    });
    if (!existingCategory) {
      return errorResponse(res, "Category not found", 400);
    }
    let existingSubCategory =
      await jobSubCategoryServices.getSubCategoryBasedOnId(jobSubCategoryId);
    if (!existingSubCategory) {
      return errorResponse(res, "SubCategory not found");
    }

    const nameRegex = /^[^\x00-\x1F\x7F]+$/;

    // Validate each skill name up front
    for (const singleSkill of skillName) {
      const trimmed = singleSkill.trim();
      if (!nameRegex.test(trimmed)) {
        return errorResponse(
          res,
          `Skill name "${trimmed}" contains invalid characters`,
          400
        );
      }
      if (trimmed.length > 30) {
        return errorResponse(
          res,
          `Skill name must not exceed 20 characters`,
          400
        );
      }
    }

    // Fetch active and deleted skills once for duplicate/restore checks
    const activeSkills = await prisma.skills.findMany({
      where: { isDelete: false },
      select: { skillName: true },
    });

    const deletedSkills = await prisma.skills.findMany({
      where: { isDelete: true },
      select: { id: true, skillName: true },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const singleSkill of skillName) {
      const trimmed = singleSkill.trim();
      const normalizedInput = trimmed.replace(/\s+/g, "").toLowerCase();

      const isDuplicate = activeSkills.some(
        (s) => s.skillName.replace(/\s+/g, "").toLowerCase() === normalizedInput
      );

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      const deletedMatch = deletedSkills.find(
        (s) => s.skillName.replace(/\s+/g, "").toLowerCase() === normalizedInput
      );

      if (deletedMatch) {
        await prisma.skills.update({
          where: { id: deletedMatch.id },
          data: { skillName: trimmed, jobCategoryId, jobSubCategoryId, isDelete: false },
        });
      } else {
        await skillsServices.createSkill(trimmed, jobCategoryId, jobSubCategoryId);
      }
      createdCount++;
    }

    if (createdCount === 0 && skippedCount > 0) {
      return errorResponse(res, "All selected skills already exist", 400);
    }

    return successResponse(res, {}, "Skills created successfully", 200);
  } catch (error) {
    console.error("ERROR ::", error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getSkillsBasedOnCategoryAndSubCategory = async (req, res) => {
  try {
    let { subCategoryIds  } = req.body || {};
    // if (!categoryId) {
    //   return errorResponse(res, "Category id is required", 400);
    // }
    if (subCategoryIds) {
  if (!Array.isArray(subCategoryIds)) {
      subCategoryIds = [subCategoryIds];
    }    }
  

    
    // let existingCategory = await jobCategoryServices.getJobCategoryBasedOnId(
    //   categoryId
    // );
    // if (!existingCategory) {
    //   return errorResponse(res, "Category not found", 400);
    // }
    // let existingSubCategory =
    //   await jobSubCategoryServices.getSubCategoryBasedOnId(subCategoryIds);
    // if (!existingSubCategory) {
    //   return errorResponse(res, "SubCategory not found", 400);
    // }
    // let existingSkills =
    //   await skillsServices.getSkillsBasedOnCategoryAndSubCategory(
    //     categoryId,
    //     subCategoryId
    //   );

    const where = {
        isDelete: false,
      }

      if(subCategoryIds && !subCategoryIds?.includes("ALL") && subCategoryIds?.length > 0){
         where.jobSubCategoryId = {
          in: subCategoryIds,
        }
      }

    let existingSkills = await prisma.skills.findMany({
      where: where,
      select: {
        id: true,
        skillName: true
      },
    });

    return successResponse(res, existingSkills, "skills fetched successfully");
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getSkillsForAdmin = async (req, res) => {
  try {
    let {
      jobCategoryId,
      jobSubCategoryId,
      currentPage = 1,
      itemsPerPage = 4,
    } = req.body || {};

    if (jobCategoryId) {
      if (!validator.isUUID(jobCategoryId)) {
        return errorResponse(res, "Invalid Category id", 400);
      }
    }
    if (jobSubCategoryId) {
      if (!validator.isUUID(jobSubCategoryId)) {
        return errorResponse(res, "Invalid SubCategory id", 400);
      }
    }
    let existingSkills = await skillsServices.getSkillsForAdmin(
      jobCategoryId,
      jobSubCategoryId,
      currentPage,
      itemsPerPage
    );
    return successResponse(
      res,
      existingSkills,
      "Skills fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateSkill = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { skillName, jobCategoryId, jobSubCategoryId } = req.body || {};
    if (!id) {
      return errorResponse(res, "Skill id is required", 400);
    }
    if (!skillName) {
      return errorResponse(res, "Skill name is required", 400);
    }
    skillName = skillName.trim();
    if (/^\d+$/.test(skillName)) {
      return errorResponse(res, "Skill name cannot be only digits", 400);
    }
    const onlySpecialChars = /^[^a-zA-Z0-9]+$/;
    if (onlySpecialChars.test(skillName)) {
      return errorResponse(
        res,
        "Skill name cannot only special characters",
        400
      );
    }
    if (skillName.length < 3) {
      return errorResponse(
        res,
        "Skill name should be atleast 3 characters",
        400
      );
    }
    if (skillName.length > 30) {
      return errorResponse(
        res,
        "Skill name must not exceed 30 characters",
        400
      );
    }
    if (!jobCategoryId) {
      return errorResponse(res, "Category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "SubCategory id is required", 400);
    }
    let existingSkill = await skillsServices.getSkillBasedOnId(id);
    if (!existingSkill) {
      return errorResponse(res, "Skill not found", 400);
    }
    let existingSkillName = await skillsServices.getSkillNameForUpdate(
      id,
      skillName
    );
    if (existingSkillName) {
      return errorResponse(res, "Skill name already exists", 400);
    }
    let existingCategory = await jobCategoryServices.getJobCategoryBasedOnId(
      jobCategoryId
    );
    if (!existingCategory) {
      return errorResponse(res, "Category not found", 400);
    }
    let existingSubCategory =
      await jobSubCategoryServices.getSubCategoryBasedOnId(jobSubCategoryId);
    if (!existingSubCategory) {
      return errorResponse(res, "SubCategory not found", 400);
    }
    await skillsServices.updateSkill(
      id,
      skillName,
      jobCategoryId,
      jobSubCategoryId
    );
    return successResponse(res, {}, "Skill updated successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Skill id is required", 400);
    }
    let existingSkill = await skillsServices.getSkillBasedOnId(id);
    if (!existingSkill) {
      return errorResponse(res, "Skill not found", 400);
    }
    if (existingSkill.isDelete) {
      return errorResponse(res, "Skill Not found", 404);
    }
    await skillsServices.deleteSkill(id);
    return successResponse(res, {}, "Skill deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.generateSkillsBasedOnCategoryAndSubCategory = async (req, res) => {
  try {
    let { jobCategoryId, jobSubCategoryId } = req.body || {};
    if (!jobCategoryId) {
      return errorResponse(res, "Category Id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "SubCategory id is required", 400);
    }
    let existingCategory = await jobCategoryServices.getJobCategoryBasedOnId(
      jobCategoryId
    );
    if (!existingCategory) {
      return errorResponse(res, "Category not found", 400);
    }
    let existingSubCategory =
      await jobSubCategoryServices.getSubCategoryBasedOnId(jobSubCategoryId);
    if (!existingSubCategory) {
      return errorResponse(res, "SubCategory not found", 400);
    }
    let { categoryName } = existingCategory || {};
    let { subCategoryName } = existingSubCategory || {};
    const skillsPrompt = `
You are an expert HR and technical recruiter. Based on the given internship domain, generate a realistic list of practical skills that interns would need in the real world.

Category: ${categoryName}
Subcategory: ${subCategoryName}

Output Rules:
1. Respond in **strict JSON format** with one field only:
{
  "skills": ["skill1", "skill2", "skill3", ...]
}
2. Provide between **6 and 12** skills in the array.
3. Skills must be relevant to internships and industry needs (mix of technical + practical tools/frameworks).
4. Keep each skill concise (max 3 words).
5. Do not include explanations, comments, or extra text outside the JSON.
6. Vary the skills across requests so the list feels fresh and not repetitive.
`;

    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages: [{ role: "user", content: skillsPrompt }],
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer a56fd063419284b27b4322bedf2a5ede14924993cf6fe284b204295b0589f893`,
          "Content-Type": "application/json",
        },
      }
    );
    let { skills } = JSON.parse(response.data.choices[0].message.content);
    let existingSkills =
      await skillsServices.getSkillsBasedOnCategoryAndSubCategory(
        jobCategoryId,
        jobSubCategoryId
      );

    return successResponse(res, skills, "Skills generated successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.generateNewSkillsUsingAi = async (req, res) => {
  try {
    let { jobCategoryId, jobSubCategoryId } = req.body || {};
    if (!jobCategoryId) {
      return errorResponse(res, "Job Category id is required", 400);
    }
    if (!jobSubCategoryId) {
      return errorResponse(res, "Job SubCategory id is required", 400);
    }
    if (!validator.isUUID(jobCategoryId)) {
      return errorResponse(res, "Invalid job category id", 400);
    }
    if (!validator.isUUID(jobSubCategoryId)) {
      return errorResponse(res, "Invalid subCategory id", 400);
    }
    let existingCategory = await prisma.jobCategory.findUnique({
      where: {
        id: jobCategoryId,
      },
    });
    if (!existingCategory) {
      return errorResponse(res, "Job category not found", 400);
    }
    let existingSubCategory =
      await jobSubCategoryServices.getSubCategoryBasedOnId(jobSubCategoryId);
    if (!existingSubCategory) {
      return errorResponse(res, "Job SubCategory not found", 400);
    }
    let { categoryName } = existingCategory;
    let { subCategoryName } = existingSubCategory;
    let existingSkills =
      await skillsServices.getSkillsBasedOnCategoryAndSubCategory(
        jobCategoryId,
        jobSubCategoryId
      );
    let skills = [];
    for (let skill of existingSkills) {
      skills.push(skill.skillName);
    }
    let prompt = await generateSkillsPrompt(
      categoryName,
      subCategoryName,
      skills
    );
    let newSkills = await generateSkillsAI(prompt);
 
      return successResponse(
        res,
        newSkills,
        "Skills generated successfully",
        {},
        200,
      );
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
