const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const companyManagementServices = require("../../services/CompanyManagement/CompanyManagement.service");
const validateEmail = require("../../validations/validateEmail");
const validatePassword = require("../../validations/validatePassword");
const prisma = require("../../config/database");
const { link } = require("joi");
const validator = require("validator");
const { sendCompanyStatusMail } = require("../../helpers/sendMail");
const {
  sendWebPushNotification,
} = require("../../helpers/WebPushNotification/notificationHelper");
exports.companyRegistration = async (req, res) => {
  try {
    let {
      companyName,
      industry,
      websiteUrl,
      address,
      hrAndRecruiterName,
      email,
      phoneNumber,
      countryCode,
      companyIntro,
      companyStatus = "PENDING",
    } = req.body || {};
    let { logo } = req.files || {};
    if (!logo) {
      return errorResponse(res, "Logo is required", 400);
    }
    if (!companyName) {
      return errorResponse(res, "Company name is required", 400);
    }
    if (!industry) {
      return errorResponse(res, "Industry is required", 400);
    }
    if (!websiteUrl) {
      return errorResponse(res, "Website url is required", 400);
    }
    if (!address) {
      return errorResponse(res, "Address is required", 400);
    }
    if (!hrAndRecruiterName) {
      return errorResponse(res, "HR or Recruiter name is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!validateEmail(email)) {
      return errorResponse(res, "Enter a valid email", 400);
    }
    if (!phoneNumber) {
      return errorResponse(res, "Phone number is required", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!companyIntro) {
      return errorResponse(res, "Company intro is required", 400);
    }
    await companyManagementServices.companyRegistration(
      companyName,
      industry,
      websiteUrl,
      address,
      hrAndRecruiterName,
      email,
      phoneNumber,
      countryCode,
      companyIntro,
      logo[0].filename,
      companyStatus,
    );
    return successResponse(res, {}, "Company registered successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getRegisteredCompaniesBasedOnStatus = async (req, res) => {
  try {
    let { companyStatus } = req.params || {};
    if (!companyStatus) {
      return errorResponse(res, "Company status is required", 400);
    }
    if (companyStatus) {
      let validStatus = ["PENDING", "APPROVED", "REJECTED", "PROFILEUPDATES"];
      if (!validStatus.includes(companyStatus)) {
        return errorResponse(res, "Invalid company status", 400);
      }
    }
    let companies;

    if (companyStatus === "PROFILEUPDATES") {
      companies = await prisma.companyUpdateRequests.findMany({
        where: {
          companyStatus: "PENDING",
        },
      });
    } else {
      companies = await prisma.company.findMany({
        where: {
          companyStatus: companyStatus,
          isDelete: false,
          isProfileCompleted: true,
        },
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          companyName: true,
          email: true,
          designation: true,
          hrAndRecruiterName: true,
          countryCode: true,
          phoneNumber: true,

          // ✅ FIX HERE
          industryType: true,

          companySize: true,
          companyIntro: true,
          foundedYear: true,
          panOrGst: true,
          country: true,
          state: true,
          city: true,
          zipCode: true,
          address: true,
          branchLocation: true,
          linkdinUrl: true,
          instagramUrl: true,
          youtubeUrl: true,
          websiteUrl: true,
          logo: true,
          companyStatus: true,
          isDelete: true,
          isProfileCompleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const industryIds = companies.map(c => c.industryType);

const industries = await prisma.jobCategory.findMany({
  where: {
    id: { in: industryIds },
  },
});

const industryMap = {};

industries.forEach(ind => {
  industryMap[ind.id] = ind.categoryName;
});

 companies = companies.map(company => ({
  ...company,
  industryName: industryMap[company.industryType] || null,
}));
    }
    return successResponse(
      res,
      companies,
      "Companies fetched successfully",
      200,
    );
  } catch (error) {
    console.log("error is : ", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCompanyDetailsById = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    let company =
      await companyManagementServices.getCompanyDetailsById(companyId);
    if (!company) {
      return errorResponse(res, "Company not found", 400);
    }
    let existingCompany =
      await companyManagementServices.getCompanyDetailsBasedOnCompanyId(
        companyId,
      );
    return successResponse(
      res,
      existingCompany,
      "Company details fetched successfully",
      200,
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.changeCompanyStatus = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let { companyStatus, reason } = req.body || {};

    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!companyStatus) {
      return errorResponse(res, "Company status is required", 400);
    }
    if (companyStatus) {
      let validStatus = ["PENDING", "APPROVED", "REJECTED"];
      if (!validStatus.includes(companyStatus)) {
        return errorResponse(res, "Invalid company status", 400);
      }
    }
    let existingCompany = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    //  await companyManagementServices.getCompanyDetailsById(
    //   companyId
    // );
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    const pendingUpdateRequest = await prisma.companyUpdateRequests.findFirst({
      where: {
        companyId: companyId,
        companyStatus: "PENDING",
      },
    });

    if (companyStatus === "APPROVED" && pendingUpdateRequest) {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          companyName: pendingUpdateRequest.companyName,
          email: pendingUpdateRequest.email,
          designation: pendingUpdateRequest.designation,
          hrAndRecruiterName: pendingUpdateRequest.hrAndRecruiterName,
          countryCode: pendingUpdateRequest.countryCode,
          phoneNumber: pendingUpdateRequest.phoneNumber,
          industryType: pendingUpdateRequest.industryType,
          companySize: pendingUpdateRequest.companySize,
          companyIntro: pendingUpdateRequest.companyIntro,
          foundedYear: pendingUpdateRequest.foundedYear,
          panOrGst: pendingUpdateRequest.panOrGst,
          country: pendingUpdateRequest.country,
          state: pendingUpdateRequest.state,
          city: pendingUpdateRequest.city,
          zipCode: pendingUpdateRequest.zipCode,
          address: pendingUpdateRequest.address,
          branchLocation: pendingUpdateRequest.branchLocation,
          linkdinUrl: pendingUpdateRequest.linkdinUrl,
          instagramUrl: pendingUpdateRequest.instagramUrl,
          youtubeUrl: pendingUpdateRequest.youtubeUrl,
          websiteUrl: pendingUpdateRequest.websiteUrl,
          logo: pendingUpdateRequest.companyLogo,
          smallLogo: pendingUpdateRequest.companySmallLogo,
          companyStatus: "APPROVED",
          rejectReason: null,
        },
      });

      // Mark request approved
      await prisma.companyUpdateRequests.update({
        where: { id: pendingUpdateRequest.id },
        data: { companyStatus: "APPROVED", approvedAt: new Date() },
      });
    }

    // If rejected then only update request table
    if (companyStatus === "REJECTED" && pendingUpdateRequest) {
      await prisma.companyUpdateRequests.update({
        where: { id: pendingUpdateRequest.id },
        data: { companyStatus: "REJECTED", rejectedReason: reason },
      });
    }
    if (companyStatus === "APPROVED" && pendingUpdateRequest) {
      await prisma.company.update({
        where: {
          id: companyId,
        },
        data: {
          companyName: pendingUpdateRequest.companyName,
          email: pendingUpdateRequest.email,
          designation: pendingUpdateRequest.designation,
          hrAndRecruiterName: pendingUpdateRequest.hrAndRecruiterName,
          countryCode: pendingUpdateRequest.countryCode,
          phoneNumber: pendingUpdateRequest.phoneNumber,
          logo: pendingUpdateRequest.logo,
          smallLogo: pendingUpdateRequest.smallLogo,
          industryType: pendingUpdateRequest.industryType,
          companySize: pendingUpdateRequest.companySize,
          companyIntro: pendingUpdateRequest.companyIntro,
          foundedYear: pendingUpdateRequest.foundedYear,
          panOrGst: pendingUpdateRequest.panOrGst,

          country: pendingUpdateRequest.country,
          state: pendingUpdateRequest.state,
          city: pendingUpdateRequest.city,
          zipCode: pendingUpdateRequest.zipCode,
          address: pendingUpdateRequest.address,
          branchLocation: pendingUpdateRequest.branchLocation,

          linkdinUrl: pendingUpdateRequest.linkdinUrl,
          instagramUrl: pendingUpdateRequest.instagramUrl,
          youtubeUrl: pendingUpdateRequest.youtubeUrl,
          websiteUrl: pendingUpdateRequest.websiteUrl,
        },
      });
    }
    // else{
    //   await prisma.company.update({
    //     where: {
    //       id: companyId,
    //     },
    //     data: {
    //       companyStatus: companyStatus,
    //       rejectReason: reason
    //     },
    //   })
    // }
    if (!pendingUpdateRequest) {
      await prisma.company.update({
        where: {
          id: companyId,
        },
        data: {
          companyStatus: companyStatus,
          rejectReason: reason,
        },
      });
    }
    let email = existingCompany.email;
    let companyName = existingCompany.companyName;
    let fcmToken = existingCompany.fcmToken;

    if (fcmToken) {
      await sendWebPushNotification(
        fcmToken,
        (title = "Company Status"),
        (body = `Your company ${companyName} is ${companyStatus}`),
      );

      await prisma.notification.create({
        data: {
          companyId: companyId,
          title: "Company Status",
          message: `Your company ${companyName} is ${companyStatus}`,
        },
      });
    }
    await sendCompanyStatusMail({
      email,
      companyName,
      status: companyStatus,
      reason,
    });
    // await prisma.company.update({
    //   where: {
    //     id: companyId,
    //   },
    //   data: {
    //     companyStatus: companyStatus,
    //     rejectReason : reason
    //   },
    // });
    // await companyManagementServices.updateCompanyStatus(
    //   companyId,
    //   companyStatus,
    //   reason
    // );
    return successResponse(res, {}, "Company status updated successfully", 200);
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateCompanyDetails = async (req, res) => {
  try {
    let { id } = req.params || {};
    let {
      companyName,
      industry,
      websiteUrl,
      address,
      hrAndRecruiterName,
      email,
      phoneNumber,
      countryCode,
      companyIntro,
    } = req.body || {};
    let { logo } = req.files || {};
    if (!id) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!companyName) {
      return errorResponse(res, "Company name is required", 400);
    }
    if (!industry) {
      return errorResponse(res, "Industry is required", 400);
    }
    if (!websiteUrl) {
      return errorResponse(res, "Website url is required", 400);
    }
    if (!address) {
      return errorResponse(res, "Address is required", 400);
    }
    if (!hrAndRecruiterName) {
      return errorResponse(res, "HR or Recruiter name is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!validateEmail(email)) {
      return errorResponse(res, "Enter a valid email", 400);
    }
    if (!phoneNumber) {
      return errorResponse(res, "Phone number is required", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!companyIntro) {
      return errorResponse(res, "Company intro is required", 400);
    }
    let existingCompany =
      await companyManagementServices.getCompanyDetailsById(id);
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    await companyManagementServices.updateCompanyDetails(
      id,
      companyName,
      industry,
      websiteUrl,
      address,
      hrAndRecruiterName,
      email,
      phoneNumber,
      countryCode,
      companyIntro,
      (logo = logo ? logo[0].filename : existingCompany.logo),
    );
    return successResponse(
      res,
      {},
      "Company details updated successfully",
      200,
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteCompanyDetails = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Company id is required", 400);
    }
    let existingCompany =
      await companyManagementServices.getCompanyDetailsById(id);
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    await companyManagementServices.deleteCompanyDetail(id);
    return successResponse(
      res,
      {},
      "Company details deleted successfully",
      200,
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep1 = async (req, res) => {
  try {
    let { companyName, email, personDesignation, personName, password } =
      req.body || {};
    if (!companyName) {
      return errorResponse(res, "Company name is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!personDesignation) {
      return errorResponse(res, "Designation is required", 400);
    }
    if (!personName) {
      return errorResponse(res, "Person name is required", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    let existingDraft = await prisma.companyRegistrationDraft.findFirst({
      where: {
        email: email,
      },
    });
    let existingCompany = await prisma.company.findFirst({
      where: {
        email: email,
      },
    });
    if (existingDraft || existingCompany) {
      return res.status(400).json({ message: "Email already in use" });
    }
    let draft = await companyManagementServices.companyRegistrationStep1(
      req.body,
    );
    return successResponse(res, draft, "Step 1 saved");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep2 = async (req, res) => {
  try {
    let { draftId } = req.params || {};
    const { industryType, companySize, description, panGst } = req.body || {};
    const { companyLogo, companySortLogo } = req.files || {};
    if (!draftId) {
      return errorResponse(res, "Draft id is required", 400);
    }
    if (!industryType) {
      return errorResponse(res, "Industry type is required", 400);
    }
    if (!companySize) {
      return errorResponse(res, "Company size is required", 400);
    }
    if (!description) {
      return errorResponse(res, "Description is required", 400);
    }
    if (!panGst) {
      return errorResponse(res, "PAN / GST is required", 400);
    }
    if (!companyLogo) {
      return errorResponse(res, "Company logo is required", 400);
    }
    if (!companySortLogo) {
      return errorResponse(res, "Company sort logo is required", 40);
    }
    await companyManagementServices.companyRegistrationStep2(draftId, {
      companyLogo: companyLogo[0].filename,
      companySortLogo: companySortLogo[0].filename,
      industryType,
      companySize,
      description,
      panGst,
    });
    return successResponse(res, {}, "Step 2 saved successfully", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep3 = async (req, res) => {
  try {
    let { draftId } = req.params || {};
    const { country, state, city, pincode, headOfficeAddress, branchOffices } =
      req.body || {};
    if (!draftId) {
      return errorResponse(res, "Draft id is required", 400);
    }
    if (!country) {
      return errorResponse(res, "Country is required", 400);
    }
    if (!state) {
      return errorResponse(res, "State is required", 400);
    }
    if (!city) {
      return errorResponse(res, "City is required", 400);
    }
    if (!pincode) {
      return errorResponse(res, "Pincode is required", 400);
    }
    if (!headOfficeAddress) {
      return errorResponse(res, "Head office address is required", 400);
    }
    await companyManagementServices.companyRegistrationStep3(draftId, {
      country,
      state,
      city,
      pincode,
      headOfficeAddress,
      branchOffices,
    });
    return successResponse(res, {}, "Step 3 saved", 200);
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep4 = async (req, res) => {
  try {
    let { draftId } = req.params || {};
    const { linkedinUrl, instagramUrl, youtubeUrl } = req.body || {};
    if (!draftId) {
      return errorResponse(res, "Draft id is required", 400);
    }
    if (!linkedinUrl) {
      return errorResponse(res, "Linkdin url is required", 400);
    }
    if (!instagramUrl) {
      return errorResponse(res, "Instagram Url is required", 400);
    }
    if (!youtubeUrl) {
      return errorResponse(res, "Youtube url is required", 400);
    }
    await companyManagementServices.companyRegistrationStep4(draftId, {
      linkedinUrl,
      instagramUrl,
      youtubeUrl,
    });
    return successResponse(
      res,
      {},
      "Company registration completed successfully",
      200,
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCompanyDetailsBasedOnCompanyId = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    let company =
      await companyManagementServices.getCompanyProfileDataBasedOnId(companyId);
    if (!company) {
      return errorResponse(res, "Company not found", 400);
    }

    return successResponse(
      res,
      company,
      "Company details fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", {}, 500);
  }
};

exports.updateCompanyProfile = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let {
      companyName,
      email,
      designation,
      hrAndRecruiterName,
      countryCode,
      phoneNumber,
      password,
      fcmToken,
      industryType,
      companySize,
      companyIntro,
      foundedYear,
      panOrGst,
      country,
      state,
      city,
      zipCode,
      address,
      branchLocation,
      linkdinUrl,
      instagramUrl,
      youtubeUrl,
      websiteUrl,
    } = req.body || {};
    let { companyLogo, companySmallLogo } = req.files || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400);
    }
    if (!companySize) {
      return errorResponse(res, "Company size is required", 400);
    }
    if (!validator.isInt(companySize.toString(), { min: 1, max: 100000 })) {
      return errorResponse(res, "Company size must be a valid number", 400);
    }
    if (!companyName) {
      return errorResponse(res, "Company name is required", 400);
    }
    if (!validator.isLength(companyName, { min: 2, max: 100 })) {
      return errorResponse(
        res,
        "Company name must be between 2–100 characters",
        400,
      );
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!validator.isEmail(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    if (!designation) {
      return errorResponse(res, "Designation is required", 400);
    }
    if (!validator.isLength(designation, { min: 2, max: 50 })) {
      return errorResponse(res, "Designation must be 2–50 characters", 400);
    }
    if (!hrAndRecruiterName) {
      return errorResponse(res, "HR or Recruiter name is required", 400);
    }
    if (
      !validator.isAlpha(validator.blacklist(hrAndRecruiterName, " "), "en-US")
    ) {
      return errorResponse(
        res,
        "HR/Recruiter name must contain only letters",
        400,
      );
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }

    if (!phoneNumber) {
      return errorResponse(res, "Phone number is required", 400);
    }
    if (!validator.isMobilePhone(phoneNumber, "any")) {
      return errorResponse(res, "Invalid phone number", 400);
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      return errorResponse(res, "Phone number must be exactly 10 digits", 400);
    }
    if (!industryType) {
      return errorResponse(res, "Industry type is required", 400);
    }
    if (!country) {
      return errorResponse(res, "Country is required", 400);
    }
    if (!state) {
      return errorResponse(res, "State is required", 400);
    }
    if (!city) {
      return errorResponse(res, "City is required", 400);
    }
    if (!zipCode) {
      return errorResponse(res, "Zip code is required", 400);
    }
    if (!validator.isPostalCode(zipCode, "any")) {
      return errorResponse(res, "Invalid zip/postal code", 400);
    }
    if (!address) {
      return errorResponse(res, "Address is required", 400);
    }
    if (!validator.isLength(address, { min: 5, max: 200 })) {
      return errorResponse(res, "Address must be 5–200 characters", 400);
    }
    if (!companyIntro) {
      return errorResponse(res, "Company intro is required", 400);
    }
    if (!validator.isLength(companyIntro, { min: 10, max: 500 })) {
      return errorResponse(res, "Company intro must be 10–500 characters", 400);
    }
    if (!instagramUrl) {
      return errorResponse(res, "Instagram url is required", 400);
    }
    if (!validator.isURL(instagramUrl)) {
      return errorResponse(res, "Invalid Instagram URL", 400);
    }
    if (!youtubeUrl) {
      return errorResponse(res, "Youtube url is required", 400);
    }
    if (!validator.isURL(youtubeUrl)) {
      return errorResponse(res, "Invalid Youtube URL", 400);
    }
    if (!linkdinUrl) {
      return errorResponse(res, "Linkdin url is required", 400);
    }
    if (!validator.isURL(linkdinUrl)) {
      return errorResponse(res, "Invalid LinkedIn URL", 400);
    }
    if (!websiteUrl) {
      return errorResponse(res, "Website url is required", 400);
    }
    if (!validator.isURL(websiteUrl)) {
      return errorResponse(res, "Invalid Website URL", 400);
    }
    let existingCompany =
      await companyManagementServices.getCompanyDetailsById(companyId);
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    const now = new Date();
    const emailBlockedMs = existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > now
      ? existingCompany.emailOtpBlockedUntil - now : 0;
    const mobileBlockedMs = existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > now
      ? existingCompany.mobileOtpBlockedUntil - now : 0;
    const maxBlockedMs = Math.max(emailBlockedMs, mobileBlockedMs);
    if (maxBlockedMs > 0) {
      const minutesLeft = Math.ceil(maxBlockedMs / 60000);
      return errorResponse(res, `Profile update is blocked due to too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s)`, 429);
    }
    let { logo, smallLogo } = existingCompany;
    let response = await companyManagementServices.updateCompanyProfile(
      companyId,
      req.body,
      companyLogo ? companyLogo[0].filename : logo,
      companySmallLogo ? companySmallLogo[0].filename : smallLogo,
      branchLocation,
      websiteUrl,
    );
    return successResponse(
      res,
      response,
      "Company details updated successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", {}, 500);
  }
};

exports.getCompanyIndustries = async (req, res) => {
  try {
    let response = await companyManagementServices.getCompanyIndustries();
    return successResponse(
      res,
      response,
      "Industries fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
