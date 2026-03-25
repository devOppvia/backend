const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const companyAuthServices = require("../../services/CompanyAuth/companyAuth.service");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  sendForgotPasswordEmail,
} = require("../../helpers/sendForgotPasswordEmail");
const prisma = require("../../config/database");
const { sendEmailOtp } = require("../../helpers/sendMail");
const { sendAt } = require("cron");
const { generateOTP } = require("../../helpers/generateOTP");
const sendWhatsAppOTP = require("../../helpers/sendsma");

exports.companyRegistrationStep1 = async (req, res) => {
  try {
    let {
      id,
      companyName,
      email,
      designation,
      hrAndRecruiterName,
      countryCode,
      phoneNumber,
      password,
      fcmToken,
    } = req.body || {};
    if (id) {
      if (!validator.isUUID(id)) {
        return errorResponse(res, "Invalid company id format", 400);
      }
    }
    if (!companyName || validator.isEmpty(companyName.trim())) {
      return errorResponse(res, "Company name is required", 400);
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(companyName.trim())) {
      return errorResponse(res, "Company name must contain only letters", 400);
    }

    if (!email || validator.isEmpty(email.trim())) {
      return errorResponse(res, "Email is required", 400);
    }
    const blockedDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "mail.com",
      "yandex.com",
      "protonmail.com",
      "zoho.com",
      "gmx.com",
    ];
    // const domain = email.split("@")[1]?.toLowerCase();
    // if (blockedDomains.includes(domain)) {
    //   return errorResponse(res, "Please use your business email address", 400);
    // }
    if (!validator.isEmail(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    if (!designation || validator.isEmpty(designation.trim())) {
      return errorResponse(res, "Designation is required", 400);
    }
    if (!hrAndRecruiterName || validator.isEmpty(hrAndRecruiterName.trim())) {
      return errorResponse(res, "Hr or Recruiter name is required", 400);
    }
    hrAndRecruiterName = hrAndRecruiterName.trim();
    if (!nameRegex.test(hrAndRecruiterName.trim())) {
      return errorResponse(
        res,
        "HR or Recruiter must contain only letters",
        400
      );
    }
    if (hrAndRecruiterName.length < 3) {
      return errorResponse(
        res,
        "HR or Recruiter name must be at least 3 characters long",
        400
      );
    }
    if (hrAndRecruiterName.length > 20) {
      return errorResponse(
        res,
        "HR or Recruiter name must be less than 20 characters",
        400
      );
    }
    if (!countryCode || validator.isEmpty(countryCode.trim())) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!validator.matches(countryCode, /^\+\d{1,4}$/)) {
      return errorResponse(res, "Invalid country code format (e.g., +91)", 400);
    }
    if (!phoneNumber || validator.isEmpty(phoneNumber.trim())) {
      return errorResponse(res, "Phone number is required", 400);
    }
    if (!validator.isMobilePhone(phoneNumber, "any")) {
      return errorResponse(res, "Invalid phone number format", 400);
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      return errorResponse(res, "Phone number must be exactly 10 digits", 400);
    }
    if (!password || validator.isEmpty(password.trim())) {
      return errorResponse(res, "Password is required", 400);
    }
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return errorResponse(
        res,
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
        400
      );
    }
    let existingEmail = await prisma.company.findFirst({
      where: {
        email: email,
        NOT: {
          id: id,
        },
      },
    });
    if (existingEmail) {
      return errorResponse(res, "Email already exists", 400);
    }
    let existingPhoneNumber = await prisma.company.findFirst({
      where: {
        phoneNumber: phoneNumber,
        NOT: {
          id: id,
        },
      },
    });
    if (existingPhoneNumber) {
      return errorResponse(res, "Phone number already exists", 400);
    }
    if (id) {
      let existingCompany = await companyAuthServices.fetchCompanyById(id);
      if (!existingCompany) {
        return errorResponse(res, "Company not found", 400);
      }
    }
    let hasedPassword = await bcrypt.hash(password, 8);
    let emailOtp = generateOTP(4);
    let mobileOtp = generateOTP(4);

    const sendWhatsapp = await sendWhatsAppOTP( phoneNumber, mobileOtp)
    if(!sendWhatsapp.success){
      return errorResponse(res, "Failed to send OTP to WhatsApp", 500);
    }
    console.log("response of whtsapp " , sendWhatsapp)
    // let otpEmail = String(Math.floor(1000 + Math.random() * 9000));

    // let otpMobile = String(Math.floor(1000 + Math.random() * 9000));

    let response = await companyAuthServices.companyRegistrationStep1(
      id,
      companyName,
      email,
      designation,
      hrAndRecruiterName,
      countryCode,
      phoneNumber,
      (password = hasedPassword),
      fcmToken,
      emailOtp,
      mobileOtp
    );

    await sendEmailOtp({ email, otp: emailOtp });
    return successResponse(
      res,
      response,
      "Step 1 submitted successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep2 = async (req, res) => {
  try {
    let { id, industryType, companySize, companyIntro, foundedYear, panOrGst , websiteUrl} =
      req.body || {};
    let { logo, smallLogo } = req.files || {};
    if (!id || validator.isEmpty(id.trim())) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    if (!logo) {
      return errorResponse(res, "Company logo is required", 400);
    }
    if (!smallLogo) {
      return errorResponse(res, "Company small logo is required", 400);
    }
    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(logo[0].mimetype)) {
      return errorResponse(res, "Logo must be a JPG or PNG image", 400);
    }

    if (!allowedTypes.includes(smallLogo[0].mimetype)) {
      return errorResponse(res, "Small logo must be a JPG or PNG image", 400);
    }
    if (!industryType || validator.isEmpty(industryType.trim())) {
      return errorResponse(res, "Industry type is required", 400);
    }
    if (!companySize || validator.isEmpty(companySize.trim())) {
      return errorResponse(res, "Company size is required", 400);
    }
    if (!/^\d{1,6}$/.test(companySize)) {
      return errorResponse(
        res,
        "Company size must be a number between 1 and 999999",
        400
      );
    }
    if (!companyIntro || validator.isEmpty(companyIntro.trim())) {
      return errorResponse(res, "Company introduction is required", 400);
    }
    if (companyIntro.length < 50) {
      return errorResponse(
        res,
        "Company introduction must be at least 50 characters long",
        400
      );
    }
    if (!foundedYear || validator.isEmpty(foundedYear.trim())) {
      return errorResponse(res, "Founded year is required", 400);
    }
    if (!/^(19|20)\d{2}$/.test(foundedYear)) {
      return errorResponse(
        res,
        "Founded year must be a valid year (1900–2099)",
        400
      );
    }
    if (!panOrGst || validator.isEmpty(panOrGst.trim())) {
      return errorResponse(res, "PAN or GST number is required", 400);
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (
      !(
        panRegex.test(panOrGst.toUpperCase()) ||
        gstRegex.test(panOrGst.toUpperCase())
      )
    ) {
      return errorResponse(res, "PAN or GST number format is invalid", 400);
    }
    let existingCompany = await companyAuthServices.fetchCompanyById(id);
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let response = await companyAuthServices.companyRegistrationStep2(
      id,
      (logo = logo?.[0].filename),
      (smallLogo = smallLogo?.[0].filename),
      industryType,
      companySize,
      companyIntro,
      foundedYear,
      panOrGst,
      websiteUrl
    );
    return successResponse(
      res,
      response,
      "Step 2 submitted successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep3 = async (req, res) => {
  try {
    let { id, country, state, city, zipCode, address, branchLocations } =
      req.body || {};
    if (!id || validator.isEmpty(id.trim())) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    if (!country || validator.isEmpty(country.trim())) {
      return errorResponse(res, "Country is required", 400);
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(country)) {
      return errorResponse(
        res,
        "Country must only contain letters and be 2–50 characters long",
        400
      );
    }
    if (!state || validator.isEmpty(state.trim())) {
      return errorResponse(res, "State is required", 400);
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(state)) {
      return errorResponse(
        res,
        "State must only contain letters and be 2–50 characters long",
        400
      );
    }
    if (!city || validator.isEmpty(city.trim())) {
      return errorResponse(res, "City is required", 400);
    }
    if (!/^[a-zA-Z\s.,'-]{2,50}$/.test(city)) {
      return errorResponse(
        res,
        "City must be 2–50 characters long and can include letters, spaces, and special characters (.,'-)",
        400
      );
    }

    if (!zipCode || validator.isEmpty(zipCode.trim())) {
      return errorResponse(res, "Zip code is required", 400);
    }
    if (!/^\d{5,6}$/.test(zipCode)) {
      return errorResponse(res, "zip Code is invalid", 400);
    }
    if (!address || validator.isEmpty(address.trim())) {
      return errorResponse(res, "Address is required", 400);
    }
    if (address.length < 10 || address.length > 200) {
      return errorResponse(
        res,
        "Address must be between 10 and 200 characters",
        400
      );
    }
    if (branchLocations) {
      if (!Array.isArray(branchLocations)) {
        return errorResponse(res, "Branch location must be an array", 400);
      }
      if (branchLocations.length === 0) {
        return errorResponse(res, "Branch location cannot be empty", 400);
      }
    }
    let existingCompany = await companyAuthServices.fetchCompanyById(id);
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let response = await companyAuthServices.companyRegistrationStep3(
      id,
      country,
      state,
      city,
      zipCode,
      address,
      branchLocations
    );
    return successResponse(
      res,
      response,
      "Step 3 submitted successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyRegistrationStep4 = async (req, res) => {
  try {
    let { id, linkdinUrl, instagramUrl, youtubeUrl, websiteUrl } =
      req.body || {};
    if (!id || validator.isEmpty(id.trim())) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid company id format", 400);
    }

    if (!linkdinUrl || validator.isEmpty(linkdinUrl.trim())) {
      return errorResponse(res, "LinkedIn URL is required", 400);
    }
    if (
      !validator.isURL(linkdinUrl, {
        protocols: ["http", "https"],
        require_protocol: true,
      })
    ) {
      return errorResponse(res, "Invalid LinkedIn URL format", 400);
    }
    if (!/^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(linkdinUrl)) {
      return errorResponse(
        res,
        "LinkedIn URL must be a valid linkedin.com profile or page",
        400
      );
    }

    if (instagramUrl && !validator.isEmpty(instagramUrl.trim())) {
      if (
        !validator.isURL(instagramUrl, {
          protocols: ["http", "https"],
          require_protocol: true,
        })
      ) {
        return errorResponse(res, "Invalid Instagram URL format", 400);
      }
      if (!/^https?:\/\/(www\.)?instagram\.com\/.*$/.test(instagramUrl)) {
        return errorResponse(
          res,
          "Instagram URL must be a valid instagram.com profile",
          400
        );
      }
    }

    if (youtubeUrl && !validator.isEmpty(youtubeUrl.trim())) {
      if (
        !validator.isURL(youtubeUrl, {
          protocols: ["http", "https"],
          require_protocol: true,
        })
      ) {
        return errorResponse(res, "Invalid YouTube URL format", 400);
      }
      if (
        !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.*$/.test(youtubeUrl)
      ) {
        return errorResponse(
          res,
          "YouTube URL must be a valid youtube.com or youtu.be link",
          400
        );
      }
    }

    if (websiteUrl && !validator.isEmpty(websiteUrl.trim())) {
      if (
        !validator.isURL(websiteUrl, {
          protocols: ["http", "https"],
          require_protocol: true,
        })
      ) {
        return errorResponse(res, "Invalid Website URL format", 400);
      }
    }
    let existingCompany = await companyAuthServices.companyRegistrationStep4(
      id
    );
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    let response = await companyAuthServices.companyRegistrationStep4(
      id,
      linkdinUrl,
      instagramUrl,
      youtubeUrl,
      websiteUrl
    );
    return successResponse(
      res,
      response,
      "Step 4 submitted successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyLogin = async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    let existingEmail = await companyAuthServices.companyLogin(email);

    if (!existingEmail) {
      return errorResponse(
        res,
        "This email is not registered with any company account",
        400
      );
    }

    let { companyStatus, isDelete } = existingEmail;

    if (isDelete) {
      return errorResponse(res, "This company profile has been deleted", 400);
    }

    if (companyStatus === "PENDING") {
      return errorResponse(
        res,
        "Your company registration is under review. Please wait for admin approval",
        400
      );
    }

    if (companyStatus === "REJECTED") {
      return errorResponse(
        res,
        "Your company registration request has been rejected",
        400
      );
    }

    let isPasswordValid = await bcrypt.compare(
      password,
      existingEmail.password
    );

    if (!isPasswordValid) {
      return errorResponse(res, "Invalid password", 400);
    }

    let token = jwt.sign(
      {
        id: existingEmail.id,
        email: existingEmail.email,
        hrAndRecruiterName: existingEmail.hrAndRecruiterName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }

    );
    let refreshToken = jwt.sign(
      {
        id: existingEmail.id,
        email: existingEmail.email,
        hrAndRecruiterName: existingEmail.hrAndRecruiterName,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );


    let userData = {
      id: existingEmail.id,
      email: existingEmail.email,
      hrAndRecruiterName: existingEmail.hrAndRecruiterName,
      designation: existingEmail.designation,
      smallLogo: existingEmail.smallLogo,
    };
    let response = {
      accessToken: token,
      refreshToken: refreshToken,
      userData,
    };
    return successResponse(res, response, "Login successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.forgotPasswordSendMail = async (req, res) => {
  try {
    let { email } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    const emailRegex = /^[^\s@]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    let existingEmail = await companyAuthServices.forgotPassword(email);
    if (!existingEmail) {
      return errorResponse(
        res,
        "This email is not registered with any company account",
        400
      );
    }
    if (existingEmail.isDelete) {
      return errorResponse(res, "This company profile has been deleted", 400);
    }
    if (existingEmail.isProfileCompleted === false) {
      return errorResponse(res, "Please complete your profile first", 400);
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        email: email,
      },
    });
    let { forgotPasswordAttemts } = existingCompany || {}
    if (forgotPasswordAttemts >= 5) {
      return res.status(400).json({
        message: "Forgot password limit exceed",
        isLimitExeeded: true
      })
    }
    let { id } = existingCompany || {}
    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        forgotPasswordAttemts: {
          increment: 1
        }
      }
    })
    let { hrAndRecruiterName } = existingCompany || {};
    let forgotPassword = await sendForgotPasswordEmail(email, hrAndRecruiterName);
    if (!forgotPassword) {
      return errorResponse(res, "Otp Send limit exceeded", 400)
    }
    return successResponse(
      res,
      {},
      "Password reset link sent successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    let { email, newPassword, confirmPassword, sentAt } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!sentAt) {
      return errorResponse(res, "Sent at is required", 400)
    }
    if (!newPassword) {
      return errorResponse(res, "New Password is required", 400);
    }
    if (!confirmPassword) {
      return errorResponse(res, "Confirm password is required", 400);
    }
    const sentTime = new Date(sentAt).getTime();
    const currentTime = Date.now();
    const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
    if (isNaN(sentTime)) {
      return res.status(400).json({
        message: "Invalid reset link",
      });
    }

    if (currentTime - sentTime > EXPIRY_TIME) {
      return res.status(400).json({
        message: "Reset link has expired. Please request a new one.",
      });
    }
    let existingEmail = await companyAuthServices.forgotPassword(email);
    if (!existingEmail) {
      return errorResponse(
        res,
        "This email is not registered with any company account",
        400
      );
    }
    if (existingEmail.isDelete) {
      return errorResponse(res, "This company profile has been deleted", 400);
    }
    if (existingEmail.isProfileCompleted === false) {
      return errorResponse(res, "Please complete your profile first", 400);
    }
    if (newPassword !== confirmPassword) {
      return errorResponse(
        res,
        "New password and confirm password does not match",
        400
      );
    }
    let hashedPassword = await bcrypt.hash(newPassword, 10);
    await companyAuthServices.resetPassword(existingEmail.id, hashedPassword);
    return successResponse(res, {}, "Password reset successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.companyLogout = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    let existingStatus = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
      select: {
        companyStatus: true,
      },
    });
    if (!existingStatus) {
      return errorResponse(res, "Company not found", 400);
    }
    return successResponse(
      res,
      existingStatus,
      "Fetched company status",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyCompanyEmailOtp = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let { otp } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    if (existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.emailOtpBlockedUntil - new Date()) / 60000);
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429);
    }
    if (otp !== existingCompany.emailOtp) {
      const newAttempts = (existingCompany.emailOtpAttempts || 0) + 1;
      const updateData = { emailOtpAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.emailOtpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.emailOtpAttempts = 0;
      }
      await prisma.company.update({ where: { id: companyId }, data: updateData });
      return errorResponse(res, "Invalid otp", 400);
    }
    if (existingCompany.emailOtpExpiry < new Date()) {
      return errorResponse(res, "Otp is expired", 400);
    }
    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        isEmailVerified: true,
        emailOtpAttempts: 0,
        emailOtpBlockedUntil: null,
      },
    });
    return successResponse(res, {}, "Otp verified successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
exports.resendCompanyEmailOtp = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let { email } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    if (existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.emailOtpBlockedUntil - new Date()) / 60000);
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429);
    }
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        emailOtp: otp,
        emailOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
      },
    });
    await sendEmailOtp({ email, otp });
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyCompanyMobileOtp = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let { otp } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    if (existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.mobileOtpBlockedUntil - new Date()) / 60000);
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429);
    }
    if (otp !== existingCompany.mobileOtp) {
      const newAttempts = (existingCompany.mobileOtpAttempts || 0) + 1;
      const updateData = { mobileOtpAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.mobileOtpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.mobileOtpAttempts = 0;
      }
      await prisma.company.update({ where: { id: companyId }, data: updateData });
      return errorResponse(res, "Invalid otp", 400);
    }
    if (existingCompany.mobileOtpExpiry < new Date()) {
      return errorResponse(res, "Otp is expired", 400);
    }
    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        isMobileVerified: true,
        mobileOtpAttempts: 0,
        mobileOtpBlockedUntil: null,
      },
    });
    return successResponse(res, {}, "Otp verified successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.resendCompanyMobileOtp = async (req, res) => {
  try {
    let { companyId } = req.params || {};
    let { mobileNumber } = req.body || {};
    if (!companyId) {
      return errorResponse(res, "Company id is required", 400);
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id format", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }

    let existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
    });
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400);
    }
    if (existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.mobileOtpBlockedUntil - new Date()) / 60000);
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429);
    }
    // const otp = String(Math.floor(1000 + Math.random() * 9000));
    let otp = "0000"
    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
      },
    });
    // await sendMobileOtp({mobileNumber, otp})
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};





exports.sendUpdateEmailOtp = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { email } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!email) {
      return errorResponse(res, "Enter Old Email is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.emailOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let otp = generateOTP(4)

   await sendEmailOtp( existingCompany.phoneNumber, otp)
    
    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        emailOtp: otp,
        emailOtpExpiry: new Date(Date.now() + 3 * 60 * 1000)
      }
    })
    let body = {
      email, otp
    }
    await sendEmailOtp(body)
    return successResponse(res, {}, "Otp sent successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.verifyOldEmailOtp = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { otp, email } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400)
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.emailOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let { emailOtp, emailOtpExpiry } = existingCompany || {}
    if (emailOtp !== otp) {
      const newAttempts = (existingCompany.emailOtpAttempts || 0) + 1
      const updateData = { emailOtpAttempts: newAttempts }
      if (newAttempts >= 5) {
        updateData.emailOtpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000)
        updateData.emailOtpAttempts = 0
      }
      await prisma.company.update({ where: { id: id }, data: updateData })
      return errorResponse(res, "Invalid otp", 400);
    }
    if (emailOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.company.update({ where: { id: id }, data: { emailOtpAttempts: 0, emailOtpBlockedUntil: null } })
    // await prisma.interns.update({
    //   where : {
    //     id : id
    //   },
    //   data : {
    //     isEmailVerified : true
    //   }
    // })
    return successResponse(res, {}, "Otp verified successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.sendOtpNewEmail = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { newEmail } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!newEmail) {
      return errorResponse(res, "New Email is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.emailOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let existingEmail = await prisma.company.findFirst({
      where: {
        email: newEmail
      }
    })
    if (existingEmail) {
      return errorResponse(res, "Email already registered", 400)
    }
    let otp = String(Math.floor(1000 + Math.random() * 9000))
    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        emailOtp: otp,
        emailOtpExpiry: new Date(Date.now() + 3 * 60 * 1000)
      }
    })
    let body = {
      email: newEmail, otp
    }

    await sendEmailOtp(body)
    return successResponse(res, {}, "OTP sended successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.verifyNewEmailAndUpdateEmail = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { otp, newEmail } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400)
    }
    if (!newEmail) {
      return errorResponse(res, "New email is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.emailOtpBlockedUntil && existingCompany.emailOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.emailOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let existingEmail = await prisma.company.findFirst({
      where: {
        email: newEmail
      }
    })

    if (existingEmail) {
      return errorResponse(res, "Email already registered", 400)
    }
    let { emailOtp, emailOtpExpiry } = existingCompany || {}
    if (emailOtp !== otp) {
      const newAttempts = (existingCompany.emailOtpAttempts || 0) + 1
      const updateData = { emailOtpAttempts: newAttempts }
      if (newAttempts >= 5) {
        updateData.emailOtpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000)
        updateData.emailOtpAttempts = 0
      }
      await prisma.company.update({ where: { id: id }, data: updateData })
      return errorResponse(res, "Invalid otp", 400);
    }
    if (emailOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        email: newEmail,
        isEmailVerified: true,
        emailOtpAttempts: 0,
        emailOtpBlockedUntil: null,
      }
    })
    return successResponse(res, {}, "Email updated successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}
//
exports.sendUpdateMobileOtp = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { mobileNumber } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!mobileNumber) {
      return errorResponse(res, "Old mobileNumber is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.mobileOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let otp = generateOTP(4)

    const response = await sendWhatsAppOTP(mobileNumber, otp)
    console.log("response is : ===>", response)
    
    if(!response.success){
      return errorResponse(res, "Otp not sent", 400)
    }

    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 3 * 60 * 1000)
      }
    })
    // let body = {
    //   email,otp
    // }
    // await sendEmailOtp(body)
    return successResponse(res, {}, "Otp sent successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.verifyOldMobileOtp = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { otp, mobileNumber } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400)
    }
    if (!mobileNumber) {
      return errorResponse(res, "mobileNumber is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.mobileOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let { mobileOtp, mobileOtpExpiry } = existingCompany || {}
    if (mobileOtp !== otp) {
      const newAttempts = (existingCompany.mobileOtpAttempts || 0) + 1
      const updateData = { mobileOtpAttempts: newAttempts }
      if (newAttempts >= 5) {
        updateData.mobileOtpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000)
        updateData.mobileOtpAttempts = 0
      }
      await prisma.company.update({ where: { id: id }, data: updateData })
      return errorResponse(res, "Invalid otp", 400);
    }
    if (mobileOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.company.update({ where: { id: id }, data: { mobileOtpAttempts: 0, mobileOtpBlockedUntil: null } })
   
    return successResponse(res, {}, "Otp verified successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.sendOtpNewMobile = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { newMobileNumber } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!newMobileNumber) {
      return errorResponse(res, "New MobileNumber is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.mobileOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let existingMobileNumber = await prisma.company.findFirst({
      where: {
        phoneNumber: newMobileNumber
      }
    })
    if (existingMobileNumber) {
      return errorResponse(res, "MobileNumber already registered", 400)
    }
    // let otp = String(Math.floor(1000 + Math.random() * 9000))
    let otp = generateOTP(4)

    const response = await sendWhatsAppOTP(newMobileNumber, otp)
    console.log("response is : ===>", response)

    if(!response.success){
      return errorResponse(res, "Otp not sent", 400)
    }

    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 3 * 60 * 1000)
      }
    })
    // let body = {
    //   mobileNumber : newMobileNumber, otp
    // }
    // await sendEmailOtp(body)
    return successResponse(res, {}, "OTP sended successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}

exports.verifyNewMobileAndUpdateMobile = async (req, res) => {
  try {
    let { id } = req.params || {}
    let { otp, newMobileNumber } = req.body || {}
    if (!id) {
      return errorResponse(res, "Intern id is required", 400)
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400)
    }
    if (!newMobileNumber) {
      return errorResponse(res, "New mobileNumber is required", 400)
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400)
    }
    let existingCompany = await prisma.company.findFirst({
      where: {
        id: id
      }
    })
    if (!existingCompany) {
      return errorResponse(res, "Company not found", 400)
    }
    if (existingCompany.mobileOtpBlockedUntil && existingCompany.mobileOtpBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingCompany.mobileOtpBlockedUntil - new Date()) / 60000)
      return errorResponse(res, `Too many incorrect attempts. Try again after ${minutesLeft} minute(s)`, 429)
    }
    let existingMobileNumber = await prisma.company.findFirst({
      where: {
        phoneNumber: newMobileNumber
      }
    })

    if (existingMobileNumber) {
      return errorResponse(res, "mobilenumber already registered", 400)
    }
    let { mobileOtp, mobileOtpExpiry } = existingCompany || {}
    if (mobileOtp !== otp) {
      const newAttempts = (existingCompany.mobileOtpAttempts || 0) + 1
      const updateData = { mobileOtpAttempts: newAttempts }
      if (newAttempts >= 5) {
        updateData.mobileOtpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000)
        updateData.mobileOtpAttempts = 0
      }
      await prisma.company.update({ where: { id: id }, data: updateData })
      return errorResponse(res, "Invalid otp", 400);
    }
    if (mobileOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.company.update({
      where: {
        id: id
      },
      data: {
        phoneNumber: newMobileNumber,
        isMobileVerified: true,
        mobileOtpAttempts: 0,
        mobileOtpBlockedUntil: null,
      }
    })
    return successResponse(res, {}, "mobilenumber updated successfully", {}, 200)
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500)
  }
}