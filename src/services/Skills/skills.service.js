const prisma = require("../../config/database");
const { generateSkillsPrompt } = require("../../helpers/generateJobAboutPrompt");
const { getPagination } = require("../../utils/getPagination");

exports.getSkillsBasedOnCategoryAndSubCategory = async (
  categoryId,
  subCategoryId
) => {
  return await prisma.skills.findMany({
    where: {
      isDelete: false,
      jobCategoryId: categoryId,
      jobSubCategoryId: subCategoryId,
    },
    select: {
      id: true,
      skillName: true,
      jobCategoryId: true,
      jobSubCategoryId: true,
      createdAt: true,
    },
  });
};

exports.getSkillBasedOnId = async (id) => {
  return await prisma.skills.findFirst({
    where: {
      id: id,
    },
  });
};

exports.getSkillBasedOnName = async (skillName) => {
  return await prisma.skills.findFirst({
    where: {
      skillName: {
        equals: skillName,
        mode: "insensitive",
      },
    },
  });
};

exports.getSkillBasedOnNameIsDelete = async (skillName)=>{
  return await prisma.skills.findFirst({
    where : {
      skillName : {
        equals : skillName,
        mode : "insensitive"
      },
      isDelete : false
    }
  })
}

exports.getSkillNameForUpdate = async (id, skillName) => {
  return await prisma.skills.findFirst({
    where: {
      skillName: {
        equals: skillName,
        mode: "insensitive",
      },
      NOT: {
        id: id,
      },
    },
  });
};

exports.createSkill = async (skill, jobCategoryId, jobSubCategoryId) => {
  return await prisma.skills.create({
    data: {
      skillName: skill,
      jobCategoryId: jobCategoryId,
      jobSubCategoryId: jobSubCategoryId,
    },
  });
};

exports.getSkillsForAdmin = async (
  jobCategoryId,
  jobSubCategoryId,
  currentPage,
  itemsPerPage
) => {
  let whereClause = {
    isDelete: false,
  
  };
  if (jobCategoryId) {
    whereClause.jobCategoryId = jobCategoryId;
  }
  if (jobSubCategoryId) {
    whereClause.jobSubCategoryId = jobSubCategoryId;
  }
  let { skip, take } = getPagination(currentPage, itemsPerPage);
  let skills = await prisma.skills.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      skillName: true,
      createdAt: true,
      jobCategory: {
        select: {
          categoryName: true,
          id: true,
        },
      },
      jobSubCategory: {
        select: {
          subCategoryName: true,
          id: true,
        },
      },
    },
    skip,
    take,
  });
  let totalSkills = await prisma.skills.count({
    where: whereClause,
  });
  return { skills, totalSkills };
};

exports.updateSkill = async (id, skillName,jobCategoryId,jobSubCategoryId) => {
  return await prisma.skills.update({
    where: {
      id: id,
    },
    data: {
      skillName: skillName,
      jobCategoryId : jobCategoryId,
      jobSubCategoryId : jobSubCategoryId
    },
  });
};

exports.deleteSkill = async (id) => {
  return await prisma.skills.update({
    where: {
      id: id,
    },
    data: {
      isDelete: true,
    },
  });
};

