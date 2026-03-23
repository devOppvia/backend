const prisma = require("../../config/database");
const { getPagination } = require("../../utils/getPagination");

exports.getSubCategoryBasedOnId = async (id) => {
  return await prisma.jobSubCategory.findFirst({
    where: {
      id: id,
    },
  });
};

exports.getSubCategoryForJobCreateBasedOnId = async(id)=>{
  return await prisma.jobSubCategory.findFirst({
    where : {
      id : id,
      isDelete : false
    }
  })
}

exports.getJobSubCategroyByNameRegex = async (subCategoryName) => {
  return await prisma.jobSubCategory.findFirst({
    where: {
      subCategoryName: {
        equals: subCategoryName,
        mode: "insensitive",
      },
    },
  });
};

exports.getJobSubCategoryByNameRegexIsDelete = async (subCategoryName)=>{
  return await prisma.jobSubCategory.findFirst({
    where : {
      subCategoryName : {
        equals : subCategoryName,
        mode : "insensitive"
      },
      isDelete : false
    }
  })
}

exports.getJobSubCategoryForUpdate = async (id, subCategoryName) => {
  return await prisma.jobSubCategory.findFirst({
    where: {
      subCategoryName: {
        equals: subCategoryName,
        mode: "insensitive",
      },
      NOT: {
        id: id,
      },
    },
  });
};

exports.getJobSubCategoryForUpdateIsDelete = async (id, subCategoryName) => {
  return await prisma.jobSubCategory.findFirst({
    where: {
      subCategoryName: {
        equals: subCategoryName,
        mode: "insensitive",
      },
      NOT: {
        id: id,
      },
      isDelete : false
    },
  });
};



exports.createJobSubCategory = async (subCategoryName, jobCategoryId) => {
  return await prisma.jobSubCategory.create({
    data: {
      subCategoryName: subCategoryName,
      jobCategoryId: jobCategoryId,
    },
  });
};

exports.getJobSubCategoriesBasedOnCategory = async (categoryId) => {
  return await prisma.jobSubCategory.findMany({
    where: {
      isDelete: false,
      jobCategoryId: categoryId,
      skills: {
        some: {
          isDelete: false,
        },
      },
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
  });
};

exports.getJobSubCategoriesForAdmin = async (
  jobCategoryId,
  currentPage,
  itemsPerPage
) => {
  let whereClause = {
    isDelete: false,
  };
  if (jobCategoryId) {
    whereClause.jobCategoryId = jobCategoryId;
  }
  let { skip, take } = getPagination(currentPage, itemsPerPage);
  let jobSubCategories = await prisma.jobSubCategory.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      subCategoryName: true,
      createdAt: true,
      jobCategory: {
        select: {
          categoryName: true,
          id: true,
        },
      },
    },
    skip,
    take,
  });
  let totalSubCategories = await prisma.jobSubCategory.count({
    where: whereClause,
  });
  return { jobSubCategories, totalSubCategories };
};

exports.getJobSubCategoriesForAdminSkills = async (jobCategoryId)=>{
  let whereClause = {
    skills : {
      some : {
        isDelete : false
      }
    }
  }
  if(jobCategoryId){
    whereClause.jobCategoryId = jobCategoryId
  }
  return await prisma.jobSubCategory.findMany({
    where : whereClause,
    orderBy : {
      createdAt : "desc"
    },
    select : {
      id : true,
      subCategoryName : true,
      createdAt : true,
      jobCategory : {
        select : {
          categoryName : true,
          id : true
        }
      }
    }
  })
}

exports.updateJobSubCategory = async (id, subCategoryName, jobCategoryId) => {
  return await prisma.jobSubCategory.update({
    where: {
      id: id,
    },
    data: {
      subCategoryName: subCategoryName,
      jobCategoryId: jobCategoryId,
    },
  });
};

exports.deleteJobSubCategory = async (id) => {
  return await prisma.jobSubCategory.update({
    where: {
      id: id,
    },
    data: {
      isDelete: true,
    },
  });
};

exports.getJobSubCategoryForJobFilter = async (companyId, jobCategoryId, jobStatus, startDate, endDate)=>{
  let whereClause = {
    isDelete : false,
    companyId : companyId,
    jobCategoryId : jobCategoryId
  }
  if(jobStatus){
    whereClause.jobStatus = jobStatus
  }
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } 
  return await prisma.jobSubCategory.findMany({
    where :{
      isDelete : false,
      jobs : {
        some : whereClause
      }
    },
    select : {
      id : true,
      subCategoryName : true
    }
  })
}

exports.getJobSubCategoriesForPrompt = async (jobCategoryId)=>{
  return await prisma.jobSubCategory.findMany({
    where : {
      isDelete : false,
      jobCategoryId : jobCategoryId
    },
    select : {
      id : true,
      subCategoryName : true
    }
  })
}
