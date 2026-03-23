const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const resumeBankServices = require("../../services/ResumeBank/resumeBank.service");
const candidateServices = require("../../services/CandidateManagement/candidateManagement.service");
const companyManagementServices = require("../../services/CompanyManagement/CompanyManagement.service");
const validator = require("validator");
const path = require("path");
const fs = require("fs");
const { log } = require("console");

exports.getAllResumeBankInterns = async (req, res) => {
  try {
    let {
      gender,
      jobCategoryIds,
      jobSubCategoryIds,
      location,
      typeOfInternship,
      companyId,
    } = req.body || {};

    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    if (gender) {
      let validGenders = ["MALE", "FEMALE", "OTHER"];
      if (!validGenders.includes(gender)) {
        return errorResponse(res, "Invalid gender", 400);
      }
    }
    if (jobCategoryIds) {
      if (!Array.isArray(jobCategoryIds)) {
        return errorResponse(res, "Job category ids must be an array", 400);
      }
    }

    let existingCompany =
      await companyManagementServices.getCompanyDetailsBasedOnCompanyId(
        companyId
      );
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let { industryType } = existingCompany || {};

    let result = await resumeBankServices.getAllResumeBankInterns(
      req.body,
      industryType
    );
    return successResponse(
      res,
      result,
      "Interns fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.resumeBankDownloadResume = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { companyId } = req.body || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    let existingIntern = await candidateServices.fetchCandidateBasedOnId(id);
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 404);
    }
    let resumePath = await candidateServices.fetchInternResumeBasedOnId(id);
    if (!resumePath) {
      return errorResponse(res, "Resume not found", 404);
    }
    let downloadedResume = await resumeBankServices.fetchedDownloadedResume(
      id,
      companyId
    );
    if (downloadedResume) {
      return errorResponse(res, "Resume already downloaded", 400);
    }
    let { resume, fullName } = resumePath || {};
    let fullPath = path.join(__dirname, "../../../uploads", resume);
    if (!fs.existsSync(fullPath)) {
      return errorResponse(res, "Resume does not exist", 404);
    }
    let fileExtension = path.extname(resume);
    let safeName = fullName.replace(/\s+/g, "-");
    let downloadName = `${safeName}-Resume${fileExtension}`;

    await resumeBankServices.saveResumeDownload(id, companyId);
    return res.download(fullPath, downloadName, (err) => {
      if (err) {
        return errorResponse(res, "Error downloading resume", 400);
      }
    });
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getDownloadedResumes = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let {
      resumeStatus,
      startDate,
      endDate,
      gender,
      jobCategoryIds,
      jobSubCategoryIds,
      location,
      typeOfInternship,
    } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    if (gender) {
      let validGenders = ["MALE", "FEMALE", "OTHER"];
      if (!validGenders.includes(gender)) {
        return errorResponse(res, "Invalid gender", 400);
      }
    }
    if (jobCategoryIds) {
      if (!Array.isArray(jobCategoryIds)) {
        return errorResponse(res, "Job category ids must be an array", 400);
      }
    }
    if (resumeStatus) {
      let validResumeStatus = [
        "REVIEW",
        "SHORTLISTED",
        "INTERVIEW",
        "HIRED",
        "REJECTED",
      ];
      if (!validResumeStatus.includes(resumeStatus)) {
        return errorResponse(res, "Invalid resume status", 400);
      }
    }
    let existingCompany =
      await companyManagementServices.getCompanyDetailsBasedOnCompanyId(
        companyId
      );
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 404);
    }
    let result = await resumeBankServices.getDownloadedResumes({
      companyId,
      resumeStatus,
      startDate,
      endDate,
      gender,
      jobCategoryIds,
      jobSubCategoryIds,
      location,
      typeOfInternship,
    });
    return successResponse(res, result, "candidates fetched successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteResumeDownload = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingResumeData =
      await resumeBankServices.fetchDownloadedResumeBasedOnId(id);
    if (!existingResumeData) {
      return errorResponse(res, "Resume not found", 404);
    }
    await resumeBankServices.deleteDownloadedResume(id);
    return successResponse(res, {}, "Resume deleted successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateDownloadedResumeStatus = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { resumeStatus } = req.body || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    if (!resumeStatus) {
      return errorResponse(res, "Resume status is required", 400);
    }
    if (resumeStatus) {
      let validStatus = [
        "REVIEW",
        "SHORTLISTED",
        "INTERVIEW",
        "HIRED",
        "REJECTED",
      ];
      if (!validStatus) {
        return errorResponse(res, "Resume status is invalid", 400);
      }
    }
    let existingData = await resumeBankServices.fetchDownloadedResumeBasedOnId(
      id
    );
    if (!existingData) {
      return errorResponse(res, "data not found", 404);
    }
    await resumeBankServices.updateDownloadedResumeStatus(id, resumeStatus);
    return successResponse(res, {}, "Status changed successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.downloadResumeBankInFree = async (req, res) => {
  try {
    let { companyId, internId } = req.body || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid id", 400);
    }
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    let existingIntern = await candidateServices.fetchCandidateBasedOnId(
      internId
    );
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 404);
    }
    let resumePath = await candidateServices.fetchInternResumeBasedOnId(
      internId
    );
    if (!resumePath) {
      return errorResponse(res, "Resume not found", 404);
    }

    let { resume, fullName } = resumePath || {};
    let fullPath = path.join(__dirname, "../../../uploads", resume);
    if (!fs.existsSync(fullPath)) {
      return errorResponse(res, "Resume does not exist", 404);
    }
    let fileExtension = path.extname(resume);
    let safeName = fullName.replace(/\s+/g, "-");
    let downloadName = `${safeName}-Resume${fileExtension}`;

    return res.download(fullPath, downloadName, (err) => {
      if (err) {
        return errorResponse(res, "Error downloading resume", 400);
      }
    });
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternCityForResumeFilter = async (req, res) => {
  try {
    let result = await resumeBankServices.getInternCityForResumeFilter();

    let city = result.map((item) => item.city);

    let uniqueCity = [];
    let seen = new Set();

    for (let c of city) {
      let lower = c.toLowerCase().trim();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueCity.push(c);
      }
    }

    return successResponse(
      res,
      uniqueCity,
      "Cities fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternIndustriesForResumeFilter = async (req, res) => {
  try {
    let result = await resumeBankServices.getInternIndustriesForResumeFilter();

    let industryType = result.map((item) => item.industryType);

    let uniqueIndustry = [];
    let seen = new Set();

    for (let c of industryType) {
      let lower = c.toLowerCase().trim();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueIndustry.push(c);
      }
    }
    let indistries = await resumeBankServices.getIndustriesBasedOnIds(
      uniqueIndustry
    );

    return successResponse(
      res,
      indistries,
      "Industries fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getDepartmentsForResumeFilter = async (req, res) => {
  try {
    let { industryId } = req.params || {};
    if (!industryId) {
      return errorResponse(res, "Industry id is required", 400);
    }
    if (!validator.isUUID(industryId)) {
      return errorResponse(res, "Invalid industry id", 400);
    }
    let existingIndustry = await resumeBankServices.fetchIndustryBasedOnId(
      industryId
    );
    if (!existingIndustry) {
      return errorResponse(res, "Industry not found", 400);
    }
    let result = await resumeBankServices.getDepartMentsBasedOnIndustryId(
      industryId
    );
    return successResponse(
      res,
      result,
      "Departments fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternForTheAdminResumebank = async (req, res) => {
  try {
    let { activeTab } = req.params || {}
    const boolValue = activeTab === "true";
    let response = await resumeBankServices.getResumesForTheAdminResumeBank(boolValue);
    return successResponse(
      res,
      response,
      "Interns fetched successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateResumeStatus = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    await resumeBankServices.updateResumeStatus(id);
    return successResponse(
      res,
      {},
      "Resume status updated successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteResumeFromResumeBank = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    await resumeBankServices.deleteResumeFromResumeBank(id);
    return successResponse(res, {}, "Resume deleted successfully", {}, 200);
  } catch (error) {
    console.error(error);
    if (error.code === "P2025") {
      return errorResponse(res, "Resume not found", 400);
    }
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateResumeBulkStatusUpdate = async (req, res) => {
  try {
    let { ids, status } = req.body || {};
    if (!ids) {
      return errorResponse(res, "Ids are required", 400);
    }
    if (!Array.isArray(ids)) {
      return errorResponse(res, "Ids must be an array", 400);
    }
    if (ids.length === 0) {
      return errorResponse(res, "Ids are required", 400);
    }
    if (status === undefined || status === null) {
      return errorResponse(res, "Status is required", 400);
    }
    await resumeBankServices.updateBulkResumeStatus(ids, status);
    return successResponse(
      res,
      {},
      "Resume status updated successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
