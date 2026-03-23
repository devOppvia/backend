const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");

exports.createBlog = async (req, res) => {
  try {
    let {
      title,
      description,
      blogCategoryId,
      blogTagIds,
      metaTitle,
      metaDescription,
      slug,
      altTag,
      isScheduled,
      scheduledDate
    } = req.body || {};
    let { image } = req.files || {};
    if (!image) {
      return errorResponse(res, "Image is required", 400);
    }
    let allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(image[0].mimetype)) {
      return errorResponse(res, "Image must be jpeg, png or jpg", 400);
    }
    if (!title) {
      return errorResponse(res, "Title is required", 400);
    }
    if (title.length < 10) {
      return errorResponse(res, "Title must be at least 10 characters", 400);
    }
    if (!description) {
      return errorResponse(res, "Description is required", 400);
    }
    if (description.length < 50) {
      return errorResponse(
        res,
        "Description must be at least 50 characters",
        400
      );
    }
    if (!blogCategoryId) {
      return errorResponse(res, "Blog category id is required", 400);
    }
    const isScheduledBool =
  isScheduled === true || isScheduled === "true" ? true : false;
    if(isScheduledBool){
      if(!scheduledDate){
        return errorResponse(res, "Scheduled date is required", 400);
      }
      if(scheduledDate < new Date()){
        return errorResponse(res, "Scheduled date must be greater than current date", 400);
      }
    }
    let existingBlogCategory = await prisma.blogCategory.findUnique({
      where: {
        id: blogCategoryId,
      },
    });

    if (!existingBlogCategory) {
      return errorResponse(res, "Blog category not found", 400);
    }

    if (!blogTagIds) {
      return errorResponse(res, "Blog tag ids is required", 400);
    }
    if (!Array.isArray(blogTagIds)) {
      if (typeof blogTagIds === "string" && blogTagIds.trim() !== "") {
        blogTagIds = blogTagIds.split(",").map((id) => id.trim());
      } else {
        blogTagIds = [];
      }
    }
    if(!altTag){
      return errorResponse(res, "Alt tag is required", 400);
    }
    let existingBlogTitle = await prisma.blog.findFirst({
      where: {
        title: title,
      },
    });
    if (existingBlogTitle) {
      return errorResponse(res, "Blog title already exists", 400);
    }

    if (!metaTitle) {
      return errorResponse(res, "Meta title is required", 400);
    }
    if (!metaDescription) {
      return errorResponse(res, "Meta description is required", 400);
    }
    if (!slug) {
      return errorResponse(res, "Slug is required", 400);
    }
    let body = {
      title,
      description,
      image: image[0].filename,
      blogCategoryId,
      blogTagIds,
      metaTitle,
      metaDescription,
      slug,
    };
    await prisma.blog.create({
      data: {
        title: title,
        description: description,
        image: image[0].filename,
        blogCategoryId: blogCategoryId,
        blogTags: {
          connect: blogTagIds.map((id) => ({ id: id })),
        },
        blogTagIds: blogTagIds,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        slug: slug,
        altTag : altTag,
        isScheduled : isScheduledBool,
        scheduledDate : isScheduledBool ? new Date(scheduledDate) : null
      },
    });
    return successResponse(res, {}, "Blog created successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    let { categoryId,tagIds } = req.body || {};
    let whereClause = {
      isDelete: false,
      OR: [
        { isScheduled: false }, 
        {
          isScheduled: true,
          scheduledDate: {
            lte: new Date(), 
          },
        },
      ],
    };
    if (categoryId) {
      whereClause.blogCategoryId = categoryId;
    }
    const tagIdsArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    if (tagIds && tagIds.length) {
      
      if (tagIdsArray.length > 0) {
        whereClause.blogTags = {
          some: {
            id: {
              in: tagIdsArray,
            },
          },
        };
      }
    }

    let blogs = await prisma.blog.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        createdAt: true,
        blogTagIds: true,
        metaTitle: true,
        metaDescription: true,
        slug: true,
        altTag : true,
        isScheduled : true,
        scheduledDate : true,
        blogCategory: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        blogTags: {
          select: {
            id: true,
            tagName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    let resent_blogs = await prisma.blog.findMany({
      where: {
        isDelete: false,
        OR: [
          { isScheduled: false },
          {
            isScheduled: true,
            scheduledDate: {
              lte: new Date(),
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        createdAt: true,
        blogTagIds: true,
        metaTitle: true,
        metaDescription: true,
        slug: true,
        altTag : true,
        isScheduled : true,
        scheduledDate : true,
        blogCategory: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        blogTags: {
          select: {
            id: true,
            tagName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    return successResponse(
      res,
      { blogs, resent_blogs },
      "Blogs fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllBlogsAdmin = async (req, res) => {
  try {
    let { categoryId,tagIds } = req.body || {};
    let whereClause = {
      isDelete: false,
    };
    if (categoryId) {
      whereClause.blogCategoryId = categoryId;
    }
    const tagIdsArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    if (tagIds && tagIds.length) {
      
      if (tagIdsArray.length > 0) {
        whereClause.blogTags = {
          some: {
            id: {
              in: tagIdsArray,
            },
          },
        };
      }
    }

    let blogs = await prisma.blog.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        createdAt: true,
        blogTagIds: true,
        metaTitle: true,
        metaDescription: true,
        slug: true,
        altTag : true,
        isScheduled : true,
        scheduledDate : true,
        blogCategory: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        blogTags: {
          select: {
            id: true,
            tagName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    let resent_blogs = await prisma.blog.findMany({
      where: {
        isDelete: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        createdAt: true,
        blogTagIds: true,
        metaTitle: true,
        metaDescription: true,
        slug: true,
        blogCategory: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        blogTags: {
          select: {
            id: true,
            tagName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    return successResponse(
      res,
      { blogs, resent_blogs },
      "Blogs fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateBlog = async (req, res) => {
  try {
    let { id } = req.params || {};
    let {
      title,
      description,
      blogCategoryId,
      blogTagIds,
      metaTitle,
      metaDescription,
      slug,
      altTag,
      isScheduled,
      scheduledDate
    } = req.body || {};
    let { image } = req.files || {};
    if (image) {
      let allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(image[0].mimetype)) {
        return errorResponse(res, "Image must be jpeg, png or jpg", 400);
      }
    }
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    let existingBlog = await prisma.blog.findUnique({
      where: {
        id: id,
      },
    });
    if (!existingBlog) {
      return errorResponse(res, "Blog not found", 400);
    }
    if (!title) {
      return errorResponse(res, "Title is required", 400);
    }
    if (title.length < 10) {
      return errorResponse(res, "Title must be at least 10 characters", 400);
    }
    if (!description) {
      return errorResponse(res, "Description is required", 400);
    }
    if (description.length < 50) {
      return errorResponse(
        res,
        "Description must be at least 50 characters",
        400
      );
    }
    if (!blogCategoryId) {
      return errorResponse(res, "Blog category id is required", 400);
    }

    let existingBlogCategory = await prisma.blogCategory.findUnique({
      where: {
        id: blogCategoryId,
      },
    });
    
    if (!existingBlogCategory) {
      return errorResponse(res, "Blog category not found", 400);
    }
    if (!blogTagIds) {
      return errorResponse(res, "Blog tag ids is required", 400);
    }
    if (!Array.isArray(blogTagIds)) {
      if (typeof blogTagIds === "string" && blogTagIds.trim() !== "") {
        blogTagIds = blogTagIds.split(",").map((id) => id.trim());
      } else {
        blogTagIds = [];
      }
    }
    if (!metaTitle) {
      return errorResponse(res, "Meta title is required", 400);
    }
    if (!metaDescription) {
      return errorResponse(res, "Meta description is required", 400);
    }
    if (!slug) {
      return errorResponse(res, "Slug is required", 400);
    }
    if(!altTag){
      return errorResponse(res, "Alt tag is required", 400);
    }
    const isScheduledBool =
    isScheduled === true || isScheduled === "true" ? true : false;
      if(isScheduledBool){
        if(!scheduledDate){
          return errorResponse(res, "Scheduled date is required", 400);
        }
        if(scheduledDate < new Date()){
          return errorResponse(res, "Scheduled date must be greater than current date", 400);
        }
      }
    let existingBlogTitle = await prisma.blog.findFirst({
      where: {
        title: title,
        id: {
          not: id,
        },
      },
    });
    
    if (existingBlogTitle) {
      return errorResponse(res, "Blog title already exists", 400);
    }

    await prisma.blog.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        description: description,
        image: image?.[0]?.filename || existingBlog.image,
        blogCategoryId: blogCategoryId,
        blogTags: {
          set: blogTagIds.map((id) => ({ id: id })),
        },
        blogTagIds: blogTagIds,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        slug: slug,
        altTag : altTag,
        isScheduled : isScheduledBool,
        scheduledDate : isScheduledBool? new Date(scheduledDate) : null
      },
    });
    
    return successResponse(res,{}, "Blog updated successfully",{}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteBlogById = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    let existingBlog = await prisma.blog.findUnique({
      where: {
        id: id,
      },
    });
    if (!existingBlog) {
      return errorResponse(res, "Blog not found", 400);
    }
    await prisma.blog.update({
      where: {
        id: id,
      },
      data: {
        isDelete: true,
      },
    });
    return successResponse(res, {}, "Blog deleted successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
