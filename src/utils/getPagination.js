const getPagination = (currentPage = 1, itemsPerPage = 10) => {
  
    const skip = (currentPage - 1) * itemsPerPage;
    return { skip, take: itemsPerPage };
  };
  
  const getPagingData = (totalItems, currentPage = 1, itemsPerPage = 10) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
      totalItems,
      currentPage,
      itemsPerPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  };
  
  module.exports = { getPagination, getPagingData };
  