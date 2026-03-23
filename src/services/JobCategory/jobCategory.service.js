const prisma = require("../../config/database");
const { getPagination } = require("../../utils/getPagination");
const { errorResponse } = require("../../utils/responseHeader");

exports.getJobCategoryBasedOnId = async (id) => {
  return await prisma.jobCategory.findFirst({
    where: {
      id: id,
      isDelete : false,
      skills : {
        some : {
          isDelete : false
        }
      }
    },
  });
};

exports.getJobCategory = async (id)=>{
  return await prisma.jobCategory.findFirst({
    where : {
      id : id,
      isDelete : false
    }
  })
}
exports.getJobCategoryByNameRegex = async (categoryName) => {
  return await prisma.jobCategory.findFirst({
    where: {
      categoryName: {
        startsWith: categoryName,
        mode: "insensitive",
      },
    },
  });
};

exports.getJobCatgoryByNameRegexFalse = async (categoryName)=>{
  return await prisma.jobCategory.findFirst({
    where : {
      categoryName : {
        startsWith : categoryName,
        mode : "insensitive"
      },
      isDelete : false
    }
  })
}

exports.getJobCategoryForUpdate = async (id, categoryName) => {
  return await prisma.jobCategory.findFirst({
    where: {
      categoryName: {
        equals: categoryName,
        mode: "insensitive",
      },
      isDelete : false,
      NOT: {
        id: id,
      },
    },
  });
};

exports.createJobCategory = async (categoryName) => {
  return await prisma.jobCategory.create({
    data: {
      categoryName: categoryName,
    },
  });
};

exports.updateJobCategory = async (id, categoryName) => {
  return await prisma.jobCategory.update({
    where: {
      id: id,
    },
    data: {
      categoryName: categoryName,
    },
  });
};

exports.getJobCategories = async () => {
  return await prisma.jobCategory.findMany({
    where: {
      isDelete: false,
      jobSubCategories : {
        some : {
          isDelete : false
        }
      },
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
      categoryName: true,
      createdAt: true,
    },
  });
};

exports.getJobCategoriesForAdmin = async (currentPage, itemsPerPage) => {
  
  let { skip, take } = getPagination(currentPage, itemsPerPage);

  let totalCategories = await prisma.jobCategory.count({
    where: {
      isDelete: false,
    },
  });

  let jobCategories = await prisma.jobCategory.findMany({
    where: {
      isDelete: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      categoryName: true,
    },
    skip,
    take,
  });

  return { totalCategories, jobCategories };
};

exports.getJobCategoriesForPrompt = async ()=>{
  return await prisma.jobCategory.findMany({
    where : {
      isDelete : false
    },
    select : {
      id : true,
      categoryName : true
    }

  })
}

exports.getJobCategoriesForSubCategory = async ()=>{
  return await prisma.jobCategory.findMany({
    where : {
      isDelete : false,
    },
    orderBy : {
      createdAt : "desc"
    },
    select : {
      id : true,
      createdAt : true,
      categoryName : true,
      jobSubCategories : {
        select : {
          id : true,
          jobCategoryId : true,
          subCategoryName : true
        }
      }
    }
  })
}

exports.deleteJobCategory = async (id) => {
  return await prisma.jobCategory.update({
    where: {
      id: id,
    },
    data: {
      isDelete: true,
    },
  });
};


exports.getJobCategoryForJobFilter = async (companyId, jobStatus, startDate, endDate)=>{

  let jobFilter = {
    isDelete: false,   
  };

  if (companyId) {
    jobFilter.companyId = companyId;
  }

  if (jobStatus) {
    jobFilter.jobStatus = jobStatus;
  }

  if (startDate && endDate) {
    jobFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    jobFilter.createdAt = { gte: new Date(startDate) };
  } else if (endDate) {
    jobFilter.createdAt = { lte: new Date(endDate) };
  }
  
  return await prisma.jobCategory.findMany({
    where : {
      jobs : {
        some : jobFilter
      }
    },
    select : {
      id : true,
      categoryName : true,
    }
  })
}


