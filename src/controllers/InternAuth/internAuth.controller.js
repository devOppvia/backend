const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const internAuthServices = require("../../services/InternAuth/internAuth.service");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/database");
const {
  sendForgotPasswordEmailIntern,
} = require("../../helpers/sendForgotPasswordEmail");
const { sendEmailOtp } = require("../../helpers/sendMail");
const { string } = require("joi");
const getAvatarPath = require("../../helpers/static_avatar_path");
const { callGeminiAPI } = require("../../helpers/geminiApi");
const { generateJobText, generateInternAboutUs } = require("../../helpers/generateRoleTitle");
const { generateOTP } = require("../../helpers/generateOTP");
const sendWhatsAppOTP = require("../../helpers/sendsma");

exports.InternRegistrationStep1 = async (req, res) => {
  try {
    let { id, fullName, email, countryCode, mobileNumber, password } =
      req.body || {};
    let { profile_picture } = req.files || {};
    if (id) {
      if (!validator.isUUID(id)) {
        return errorResponse(res, "Invalid id format", 400);
      }
    }
    if (!fullName) {
      return errorResponse(res, "Fullname is required", 400);
    }
    if (fullName.length < 3) {
      return errorResponse(
        res,
        "Fullname must be atleast 3 characters long",
        400,
      );
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    const localPart = email.split("@")[0]?.toLowerCase();
    const dummyPatterns = [
      "test",
      "dummy",
      "fake",
      "temp",
      "example",
      "sample",
      "admin",
      "user",
      "abc",
      "xyz",
      "qwerty",
      "no-reply",
      "noreply",
      "support",
      "info",
    ];

    if (dummyPatterns.some((word) => localPart.includes(word))) {
      return errorResponse(res, "Please use a valid email address", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!/^\+\d{1,3}$/.test(countryCode)) {
      return errorResponse(res, "Invalid country code format", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "Mobile Number is required", 400);
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      return errorResponse(res, "Mobile number must be exactly 10 digits", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password)
    ) {
      return errorResponse(
        res,
        "Password must include uppercase, lowercase, number, and special char",
        400,
      );
    }
    if (!profile_picture) {
      return errorResponse(res, "Profile picture is required", 400);
    }
    const allowedTypes = ["image/png", "image/jpeg"];

    if (!allowedTypes.includes(profile_picture[0].mimetype)) {
      return errorResponse(res, "Only PNG and JPG files are allowed", 400);
    }
    let existingEmail = await internAuthServices.fetchInternByEmail(email, id);
    if (existingEmail) {
      return errorResponse(res, "Email already exists", 400);
    }
    let existingMobileNumber =
      await internAuthServices.fetchInternByMobileNumber(mobileNumber, id);
    if (existingMobileNumber) {
      return errorResponse(res, "Mobile number already exists", 400);
    }
    let hasedPassword = await bcrypt.hash(password, 8);
    // const otp = String(Math.floor(1000 + Math.random() * 9000));
    let otp = generateOTP();

    let response = await internAuthServices.InternRegistrationStep1(
      fullName,
      email,
      countryCode,
      mobileNumber,
      (password = hasedPassword),
      (profile_picture = profile_picture?.[0].filename),
      id,
      otp,
    );
    return successResponse(
      res,
      response,
      "Step Submitted successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.InternRegistrationStep2 = async (req, res) => {
  try {
    let { id, DOB, gender, country, state, city, preferedLocation } =
      req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid intern id format", 400);
    }
    if (!DOB) {
      return errorResponse(res, "DOB is required", 400);
    }
    if (!gender) {
      return errorResponse(res, "Gender is required", 400);
    }
    if (gender) {
      let validGender = ["MALE", "FEMALE"];
      if (!validGender.includes(gender)) {
        return errorResponse(res, "Invalid gender value", 400);
      }
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
    if (!preferedLocation) {
      return errorResponse(res, "Prefered location is required", 400);
    }
    if (!Array.isArray(preferedLocation)) {
      return errorResponse(
        res,
        "Prefered location must be in array format",
        400,
      );
    }
    let existingData = await internAuthServices.fetchInternById(id);
    if (!existingData) {
      return errorResponse(res, "Intern not found", 400);
    }
    let response = await internAuthServices.InternRegistrationStep2(
      id,
      DOB,
      gender,
      country,
      state,
      city,
      preferedLocation,
    );
    return successResponse(
      res,
      response,
      "Step2 submitted successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.InternRegistrationStep3 = async (req, res) => {
  try {
    let {
      id,
      highestQualification,
      collageOrUniversityName,
      degreeOrCourse,
      yosOrGraduationYear,
      cgpaOrPercentage,
    } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern ID is required", 400);
    }
    if (!highestQualification) {
      return errorResponse(res, "Highest qualification is required", 400);
    }
    if (!collageOrUniversityName) {
      return errorResponse(res, "College or university name is required", 400);
    }
    if (!degreeOrCourse) {
      return errorResponse(res, "Degree or course is required", 400);
    }
    if (!yosOrGraduationYear) {
      return errorResponse(res, "Year of graduation is required", 400);
    }
    let existingIntern = await internAuthServices.fetchInternById(id);
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let response = await internAuthServices.InternRegistrationStep3(
      id,
      highestQualification,
      collageOrUniversityName,
      degreeOrCourse,
      yosOrGraduationYear,
      cgpaOrPercentage,
    );
    return successResponse(
      res,
      response,
      "Step 3 submitted successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.InternRegistrationStep4 = async (req, res) => {
  try {
    let { id, industry, department, skills, projectLinks, internAbout } =
      req.body || {};
    let { resume } = req.files || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid intern id format", 400);
    }
    if (!industry) {
      return errorResponse(res, "Industry id is required", 400);
    }
    if (!department) {
      return errorResponse(res, "Department id is required", 400);
    }
    if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(projectLinks)) {
      projectLinks = [projectLinks];
    }
    if (!Array.isArray(skills)) {
      skills = [skills];
    }
    if (!Array.isArray(skills)) {
      return errorResponse(res, "Skills must be in array format", 400);
    }
    if (!skills || !skills.some((skill) => skill.trim() !== "")) {
      return errorResponse(res, "At least one skill is required", 400);
    }
    if (!projectLinks) {
      return errorResponse(res, "Project links is required", 400);
    }
    if (!Array.isArray(projectLinks)) {
      return errorResponse(res, "Project links must be in array format", 400);
    }
    if (projectLinks.length === 0) {
      return errorResponse(res, "Project link is required", 400);
    }
    if (!resume || resume.length === 0) {
      return errorResponse(res, "Resume is required", 400);
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(resume[0].mimetype)) {
      return errorResponse(
        res,
        "Only PDF, DOC, or DOCX files are allowed for resume",
        400,
      );
    }
    if (!internAbout) {
      return errorResponse(res, "Intern about is required", 400);
    }
    if (internAbout.length < 10) {
      return errorResponse(
        res,
        "Intern about must be atleast 10 characters long",
        400,
      );
    }
    if (internAbout.length > 250) {
      return errorResponse(
        res,
        "Intern about must be less than 250 characters long",
        400,
      );
    }
    let existingIntern = await internAuthServices.fetchInternById(id);
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let response = await internAuthServices.InternRegistrationStep4(
      id,
      industry,
      department,
      skills,
      projectLinks,
      internAbout,
      (resume = resume?.[0].filename),
    );
    return successResponse(
      res,
      response,
      "Step 4 submitted successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.InternRegistrationStep5 = async (req, res) => {
  try {
    let { id, internshipType, durationPreference, language } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!internshipType) {
      return errorResponse(res, "Internship type is required", 400);
    }
    if (!durationPreference) {
      return errorResponse(res, "Duration preference is required", 400);
    }
    if (!language) {
      return errorResponse(res, "Language is required", 400);
    }
    if (!Array.isArray(language)) {
      return errorResponse(res, "Language must be in array format", 400);
    }
    if (!language || !language.some((language) => language.trim() !== "")) {
      return errorResponse(res, "At least one language is required", 400);
    }
    let existingInter = await internAuthServices.fetchInternById(id);
    if (!existingInter) {
      return errorResponse(res, "Intern not found", 400);
    }
    let response = await internAuthServices.InternRegistrationStep5(
      id,
      internshipType,
      durationPreference,
      language,
    );
    return successResponse(
      res,
      response,
      "Step 5 submitted successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.internLogin = async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    let existingIntern = await internAuthServices.getInternBasedOnEmail(email);

    if (!existingIntern) {
      return errorResponse(res, "This email is not registered", 400);
    }

    if (existingIntern.isDelete) {
      return errorResponse(res, "This account has been deleted", 400);
    }
    const comparePassword = await bcrypt.compare(
      password,
      existingIntern.password,
    );

    if (!comparePassword) {
      return errorResponse(res, "Incorrect password", 400);
    }

    let token = jwt.sign(
      {
        id: existingIntern.id,
        email: existingIntern.email,
        fullName: existingIntern.fullName,
        applicationType: existingIntern.applicationType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );
    const refreshToken = jwt.sign(
      {
        id: existingIntern.id,
        email: existingIntern.email,
        fullName: existingIntern.fullName,
        applicationType: existingIntern.applicationType,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    let internData = {
      id: existingIntern.id,
      email: existingIntern.email,
      fullName: existingIntern.fullName,
      profilePicture: existingIntern.profilePicture,
      applicationType: existingIntern.applicationType,
    };
    let response = {
      accessToken: token,
      refreshToken: refreshToken,
      internData,
    };
    return successResponse(res, response, "Login successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternJobProfileDetails = async (req, res) => {
  try {
    let { internId } = req.params || {};

    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id format", 400);
    }
    let existingIntern =
      await internAuthServices.getInternJobProfileDetailsBasedOnId(internId);
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    return successResponse(
      res,
      existingIntern,
      "Intern profile details fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateInternJobProfileBasedOnId = async (req, res) => {
  try {
    let { id } = req.params || {};

    let {
      state,
      city,
      preferredIndustries,
      preferredDepartments,
      skills,
      highestQualification,
      degreeOrCourse,
      collageOrUniversityName,
      yosOrGraduationYear,
      internshipType,
      preferredLocations,
      preferredStates,
      personalDetails,
      projectLinks,
      yearsOfExperience,
      applicationType,
      linkedin,
      github,
      portfolio,
      employmentType,
    } = req.body || {};

    let { resume, profilePicture } = req.files || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }

    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid intern id format", 400);
    }

    const existingIntern = await prisma.interns.findUnique({
      where: { id },
    });

    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 404);
    }

    // Check if intern is blocked by any verification
    const internOtpRecord = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });

    const now = new Date();
    const blockTimes = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now);

    if (blockTimes.length > 0) {
      const maxBlockedUntil = new Date(Math.max(...blockTimes.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil - now) / 60000);
      return errorResponse(
        res,
        `Profile update is blocked due to too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        429,
      );
    }

    /*
    -------------------------
    Normalize Industries
    -------------------------
    */

    if (preferredIndustries) {
      if (!Array.isArray(preferredIndustries)) {
        preferredIndustries = [preferredIndustries];
      }

      preferredIndustries = preferredIndustries.map((i) => {
        if (i.id || i.tag) return i.id || i.tag;
        return i.name;
      });
    }

    /*
    -------------------------
    Normalize Departments
    -------------------------
    */

    if (preferredDepartments) {
      if (!Array.isArray(preferredDepartments)) {
        preferredDepartments = [preferredDepartments];
      }

      preferredDepartments = preferredDepartments.map((d) => {
        if (d.id || d.tag) return d.id || d.tag;
        return d.name;
      });
    }

    /*
    -------------------------
    Normalize Skills
    -------------------------
    */

    if (skills) {
      // ensure array
      const skillsArray = Array.isArray(skills) ? skills : [skills];

      skills = {
        set: skillsArray.map((s) => ({ id: s })),
      };
    }
    /*
    -------------------------
    Normalize Preferred Locations
    -------------------------
    */

    let preferredLocationRelation;

    if (preferredLocations) {
      if (!Array.isArray(preferredLocations)) {
        preferredLocations = [preferredLocations];
      }

      preferredLocationRelation = {
        set: preferredLocations.map((l) => {
          if (l.id || l.tag) return { id: l.id || l.tag };
          return { id: l };
        }),
      };
    }

    if (preferredStates) {
      if (!Array.isArray(preferredStates)) {
        preferredStates = [preferredStates];
      }

      preferredStates = preferredStates.map((s) => {
        if (s.id || s.tag) return { id: s.id || s.tag };
        return { id: s };
      });
    }

    /*
    -------------------------
    Normalize Project Links
    -------------------------
    */

    if (projectLinks) {
      if (!Array.isArray(projectLinks)) {
        projectLinks = [projectLinks];
      }

      projectLinks = projectLinks.map((p) => ({
        title: p.title,
        url: p.url,
      }));
    }

    /*
    -------------------------
    Build Update Object
    -------------------------
    */

    const updateData = {
      stateId: state || undefined,
      cityId: city || undefined,

      industry: preferredIndustries || undefined,
      department: preferredDepartments || undefined,
      skills: skills || undefined,

      highestQualification: highestQualification || undefined,
      degreeOrCourse: degreeOrCourse || undefined,
      collageOrUniversityName: collageOrUniversityName || undefined,
      yosOrGraduationYear: yosOrGraduationYear || undefined,

      internshipType: internshipType ? internshipType.toUpperCase() : undefined,

      personalDetails: personalDetails || undefined,
      projectLink: projectLinks || undefined,

      experience: yearsOfExperience || undefined,
      applicationType: applicationType
        ? applicationType.toUpperCase()
        : undefined,

      linkedin,
      github,
      portfolio,

      profilePicture: profilePicture?.[0]?.filename || undefined,
      preferredStates: {
        set: preferredStates || [],
      },
      resume: resume?.[0]?.filename || existingIntern.resume,
    };

    if (preferredLocationRelation) {
      updateData.preferredLocation = preferredLocationRelation;
    }

    if (employmentType) {
      updateData.employmentType = employmentType.toUpperCase();
    }

    await prisma.interns.update({
      where: { id },
      data: updateData,
    });

    return successResponse(res, {}, "Profile updated successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternProfileBasedOnId = async (req, res) => {
  try {
    let { internId } = req.params || {};
    if (!internId) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(internId)) {
      return errorResponse(res, "Invalid intern id format", 400);
    }
    let existingIntern =
      await internAuthServices.getInternProfileBasedOnId(internId);
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    return successResponse(
      res,
      existingIntern,
      "Intern profile details fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateInternProfileBasedOnId = async (req, res) => {
  try {
    let { id } = req.params || {};
    let {
      fullName,
      email,
      countryCode,
      mobileNumber,
      password,
      confirmPassword,
    } = req.body || {};
    let { profilePicture } = req.files || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid intern id format", 400);
    }
    if (!fullName) {
      return errorResponse(res, "Fullname is required", 400);
    }
    if (fullName.length < 3) {
      return errorResponse(
        res,
        "Fullname must be atleast 3 characters long",
        400,
      );
    }
    if (fullName.length > 20) {
      return errorResponse(
        res,
        "Fullname must be less than 50 characters long",
        400,
      );
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!validator.isEmail(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    if (!validator.isMobilePhone(mobileNumber, "any")) {
      return errorResponse(res, "Invalid mobile number format", 400);
    }

    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }

    // Check if intern is blocked by any verification
    const internOtpRecord = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });

    const now = new Date();
    const blockTimes = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now);

    if (blockTimes.length > 0) {
      const maxBlockedUntil = new Date(Math.max(...blockTimes.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil - now) / 60000);
      return errorResponse(
        res,
        `Profile update is blocked due to too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        429,
      );
    }

    if (password) {
      if (!password) {
        return errorResponse(res, "Password is required", 400);
      }
      if (!confirmPassword) {
        return errorResponse(res, "Confirm password is required", 400);
      }
      if (password !== confirmPassword) {
        return errorResponse(
          res,
          "Password and confirm password must be same",
          400,
        );
      }
      if (password.length < 8) {
        return errorResponse(
          res,
          "Password must be atleast 8 characters long",
          400,
        );
      }
      if (password.length > 20) {
        return errorResponse(
          res,
          "Password must be less than 20 characters long",
          400,
        );
      }
      if (!password.match(/[A-Z]/)) {
        return errorResponse(
          res,
          "Password must contain atleast one uppercase letter",
          400,
        );
      }
      if (!password.match(/[a-z]/)) {
        return errorResponse(
          res,
          "Password must contain atleast one lowercase letter",
          400,
        );
      }
      if (!password.match(/[0-9]/)) {
        return errorResponse(
          res,
          "Password must contain atleast one number",
          400,
        );
      }
      if (!password.match(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/)) {
        return errorResponse(
          res,
          "Password must contain atleast one special character",
          400,
        );
      }
      const isSamePassword = await bcrypt.compare(
        password,
        existingIntern.password,
      );

      if (isSamePassword) {
        return errorResponse(
          res,
          "New password must be different from old password",
          400,
        );
      }
      password = await bcrypt.hash(password, 10);
    }
    let existingEmail = await prisma.interns.findFirst({
      where: {
        email: email,
        NOT: {
          id: id,
        },
      },
    });
    if (existingEmail) {
      return errorResponse(res, "Email already registered", 400);
    }
    let existingMobileNumber = await prisma.interns.findFirst({
      where: {
        mobileNumber: mobileNumber,
        NOT: {
          id: id,
        },
      },
    });
    if (existingMobileNumber) {
      return errorResponse(res, "Mobile number already registered", 400);
    }

    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        fullName: fullName,
        email: email,
        countryCode: countryCode,
        mobileNumber: mobileNumber,
        profilePicture: profilePicture?.[0].filename
          ? profilePicture?.[0].filename
          : existingIntern.profilePicture,
        password: password ? password : existingIntern.password,
      },
    });
    return successResponse(
      res,
      {},
      "Intern profile updated successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendForgotPasswordMailIntern = async (req, res) => {
  try {
    let { email } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    let existingEmail = await prisma.interns.findFirst({
      where: {
        email: email,
      },
    });
    if (!existingEmail) {
      return errorResponse(res, "Email is not registered", 400);
    }
    let { internStatus, isDelete } = existingEmail || {};
    if (internStatus === "PENDING") {
      return errorResponse(res, "Your account is not verified", 400);
    }
    if (internStatus === "REJECTED") {
      return errorResponse(res, "Your account is rejected", 400);
    }
    if (isDelete) {
      return errorResponse(res, "Your account is deleted", 400);
    }

    let existingIntern = await prisma.interns.findFirst({
      where: {
        email: email,
      },
    });
    let { fullName } = existingIntern || {};
    await sendForgotPasswordEmailIntern(email, fullName);
    return successResponse(res, {}, "Mail sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.resetInternPassword = async (req, res) => {
  try {
    let { email, newPassword, confirmPassword } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!newPassword) {
      return errorResponse(res, "New password is required", 400);
    }
    if (!confirmPassword) {
      return errorResponse(res, "Confirm password is required", 400);
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return errorResponse(
        res,
        "Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character",
        400,
      );
    }
    if (newPassword !== confirmPassword) {
      return errorResponse(
        res,
        "New password and confirm password do not match",
        400,
      );
    }
    let existingEmail = await prisma.interns.findFirst({
      where: {
        email: email,
      },
    });
    if (!existingEmail) {
      return errorResponse(res, "Email is not registered", 400);
    }
    let { internStatus, isDelete } = existingEmail || {};
    if (internStatus === "PENDING") {
      return errorResponse(res, "Your account is not verified", 400);
    }
    if (internStatus === "REJECTED") {
      return errorResponse(res, "Your account is rejected", 400);
    }
    if (isDelete) {
      return errorResponse(res, "Your account is deleted", 400);
    }
    let comparePassword = await bcrypt.compare(
      newPassword,
      existingEmail.password,
    );
    if (comparePassword) {
      return errorResponse(
        res,
        "New password and old password cannot be same",
        400,
      );
    }
    let hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.interns.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });
    return successResponse(res, {}, "Password reset successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.isOpenToWorkToggle = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { isOpenToWork, reasonOffboard } = req.body || {};

    if (!id) {
      return errorResponse(res, "Inter Id is required", 400);
    }

    isOpenToWork = isOpenToWork === "true" || isOpenToWork === true;
    if (
      typeof isOpenToWork === "undefined" ||
      isOpenToWork === null ||
      isOpenToWork === ""
    ) {
      return errorResponse(res, "Is open to work is required", 400);
    }
    // if (!isOpenToWork) {
    //   if (!reasonOffboard || reasonOffboard.trim() === "") {
    //     return errorResponse(res, "Reason offboard is required", 400);
    //   }
    // }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        isOpenToWork: isOpenToWork,
        reasonOffboard: reasonOffboard,
      },
    });
    return successResponse(
      res,
      {},
      "Is open to work toggled successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getInternOpenToWorkStatus = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
      select: {
        isOpenToWork: true,
        profilePicture: true,
        fullName: true,
        email: true,
        gender: true,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { profilePicture, gender } = existingIntern || {};
    if (!profilePicture) {
      let profilePicture = await getAvatarPath(gender);
      existingIntern.profilePicture = profilePicture;
      delete existingIntern.gender;
    }
    return successResponse(
      res,
      existingIntern,
      "Intern open to work status fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyInternMobileNumberOtp = async (req, res) => {
  try {
    let { mobileNumber, otp } = req.body || {};
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    let existingMobileNumber = await prisma.interns.findFirst({
      where: {
        mobileNumber: mobileNumber,
      },
    });
    if (!existingMobileNumber) {
      return errorResponse(res, "Mobile number is not registered", 400);
    }

    let { id, mobileOtp, otpVerifyBlockedUntil } = existingMobileNumber || {};

    if (otpVerifyBlockedUntil && otpVerifyBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((otpVerifyBlockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: otpVerifyBlockedUntil,
      });
    }

    if (mobileOtp !== otp) {
      const newAttempts = (existingMobileNumber.otpVerifyAttempts || 0) + 1;
      const updateData = { otpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.otpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.otpVerifyAttempts = 0;
      }
      await prisma.interns.update({ where: { id }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid otp", 400);
    }
    if (existingMobileNumber.mobileOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        isMobileVerified: true,
        otpAttempts: 0,
        otpVerifyAttempts: 0,
        otpVerifyBlockedUntil: null,
      },
    });
    return successResponse(
      res,
      {},
      "Mobile number verified successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.resendInternMobileNumberOtp = async (req, res) => {
  try {
    let { mobileNumber } = req.body || {};
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    let existingMobileNumber = await prisma.interns.findFirst({
      where: {
        mobileNumber: mobileNumber,
      },
    });
    if (!existingMobileNumber) {
      return errorResponse(res, "Mobile number is not registered", 400);
    }
    let { id } = existingMobileNumber || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    let internOtpRecord = await prisma.internOtps.findUnique({
      where: { mobileNumber: mobileNumber },
    });
    if (internOtpRecord?.otpVerifyBlockedUntil && internOtpRecord.otpVerifyBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((internOtpRecord.otpVerifyBlockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: internOtpRecord.otpVerifyBlockedUntil,
      });
    }
    let { otpAttempts } = existingMobileNumber || {};
    if (otpAttempts >= 3) {
      // return errorResponse(res, {isLimitExeeded : true},"Otp attempts exceeded", 400)
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    // const otp = String(Math.floor(1000 + Math.random() * 9000));
    let otp = generateOTP();
    await sendWhatsAppOTP(mobileNumber, otp);
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        otpAttempts: {
          increment: 1,
        },
      },
    });
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendOtpInternOtpInEmail = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { email } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let existingEmail = await prisma.interns.findFirst({
      where: {
        email: email,
        NOT: {
          id: id,
        },
      },
    });

    if (existingEmail) {
      return errorResponse(res, "Email already registered", 400);
    }
    let { emailOtpAttempts } = existingIntern || {};
    const internOtpRecord1 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now1 = new Date();
    const blockTimes1 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord1?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now1);
    if (blockTimes1.length > 0) {
      const maxBlockedUntil1 = new Date(Math.max(...blockTimes1.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil1 - now1) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil1,
      });
    }
    if (emailOtpAttempts >= 3) {
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    // let { email, fullName } = existingIntern || {};
    const otp = generateOTP(4);
    let body = {
      email,
      otp,
    };

    await sendEmailOtp(body);
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        emailOtp: otp,
        emailOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        isEmailVerified: false,
        emailOtpAttempts: {
          increment: 1,
        },
      },
    });
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyOtpInternOtpInEmail = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { otp, email } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { emailOtp, emailOtpExpiry } = existingIntern || {};
    const internOtpRecord3 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now3 = new Date();
    const blockTimes3 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord3?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now3);
    if (blockTimes3.length > 0) {
      const maxBlockedUntil3 = new Date(Math.max(...blockTimes3.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil3 - now3) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil3,
      });
    }

    if (emailOtp !== otp) {
      const newAttempts = (existingIntern.emailOtpVerifyAttempts || 0) + 1;
      const updateData = { emailOtpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.emailOtpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.emailOtpVerifyAttempts = 0;
      }
      await prisma.interns.update({ where: { id }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid otp", 400);
    }
    if (emailOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        isEmailVerified: true,
        email: email,
        emailOtpAttempts: 0,
        emailOtpVerifyAttempts: 0,
        emailOtpVerifyBlockedUntil: null,
      },
    });
    return successResponse(res, {}, "Otp verified successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendInternOtpMobileNumber = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { mobileNumber } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    // if(!validator.isULID(id)){
    //   return errorResponse(res, "Invalid id", 400)
    // }
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    if (!validator.isMobilePhone(mobileNumber)) {
      return errorResponse(res, "Invalid mobile number", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { otpAttempts, otpVerifyBlockedUntil } = existingIntern || {};
    if (otpVerifyBlockedUntil && otpVerifyBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((otpVerifyBlockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: otpVerifyBlockedUntil,
      });
    }
    if (otpAttempts >= 3) {
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    // let otp = Math.floor(1000 + Math.random() * 9000)
    let otp = generateOTP(4);
    // let body = {
    //   mobileNumber,
    //   otp
    // }
    // await sendOtpMobileNumber(body)

    const response = await sendWhatsAppOTP(mobileNumber, otp);
    if (!response) {
      return errorResponse(res, "Failed to send otp", 500);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        otpAttempts: {
          increment: 1,
        },
      },
    });
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendUpdateEmailOtp = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { email } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Enter Old Email is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { emailOtpAttempts } = existingIntern || {};
    const internOtpRecord4 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now4 = new Date();
    const blockTimes4 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord4?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now4);
    if (blockTimes4.length > 0) {
      const maxBlockedUntil4 = new Date(Math.max(...blockTimes4.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil4 - now4) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil4,
      });
    }
    if (emailOtpAttempts >= 3) {
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    let otp = generateOTP(4);
    await sendEmailOtp({
      email,
      otp,
    });
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        emailOtp: otp,
        emailOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
      },
    });
    let body = {
      email,
      otp,
    };
    await sendEmailOtp(body);
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyOldEmailOtp = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { otp, email } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { emailOtp, emailOtpExpiry, emailOtpVerifyBlockedUntil } = existingIntern || {};

    if (emailOtpVerifyBlockedUntil && emailOtpVerifyBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((emailOtpVerifyBlockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: emailOtpVerifyBlockedUntil,
      });
    }

    if (emailOtp !== otp) {
      const newAttempts = (existingIntern.emailOtpVerifyAttempts || 0) + 1;
      const updateData = { emailOtpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.emailOtpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.emailOtpVerifyAttempts = 0;
      }
      await prisma.interns.update({ where: { id }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid otp", 400);
    }
    if (emailOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.interns.update({
      where: { id },
      data: { emailOtpVerifyAttempts: 0, emailOtpVerifyBlockedUntil: null },
    });
    return successResponse(res, {}, "Otp verified successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendOtpNewEmail = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { newEmail } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!newEmail) {
      return errorResponse(res, "New Email is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let existingEmail = await prisma.interns.findFirst({
      where: {
        email: newEmail,
      },
    });
    if (existingEmail) {
      return errorResponse(res, "Email already registered", 400);
    }
    let { emailOtpAttempts } = existingIntern || {};
    const internOtpRecord5 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now5 = new Date();
    const blockTimes5 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord5?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now5);
    if (blockTimes5.length > 0) {
      const maxBlockedUntil5 = new Date(Math.max(...blockTimes5.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil5 - now5) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil5,
      });
    }
    if (emailOtpAttempts >= 3) {
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    let otp = String(Math.floor(1000 + Math.random() * 9000));
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        emailOtp: otp,
        emailOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        emailOtpAttempts: {
          increment: 1,
        },
      },
    });
    let body = {
      email: newEmail,
      otp,
    };
    await sendEmailOtp(body);
    return successResponse(res, {}, "OTP sended successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyNewEmailAndUpdateEmail = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { otp, newEmail } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    if (!newEmail) {
      return errorResponse(res, "New email is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let existingEmail = await prisma.interns.findFirst({
      where: {
        email: newEmail,
      },
    });

    if (existingEmail) {
      return errorResponse(res, "Email already registered", 400);
    }
    let { emailOtp, emailOtpExpiry } = existingIntern || {};
    const internOtpRecord6 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now6 = new Date();
    const blockTimes6 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord6?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now6);
    if (blockTimes6.length > 0) {
      const maxBlockedUntil6 = new Date(Math.max(...blockTimes6.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil6 - now6) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil6,
      });
    }

    if (emailOtp !== otp) {
      const newAttempts = (existingIntern.emailOtpVerifyAttempts || 0) + 1;
      const updateData = { emailOtpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.emailOtpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.emailOtpVerifyAttempts = 0;
      }
      await prisma.interns.update({ where: { id }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid otp", 400);
    }
    if (emailOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        email: newEmail,
        isEmailVerified: true,
        emailOtpAttempts: 0,
        emailOtpVerifyAttempts: 0,
        emailOtpVerifyBlockedUntil: null,
      },
    });
    return successResponse(res, {}, "Email updated successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendUpdateMobileOtp = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { mobileNumber } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "Old mobileNumber is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { otpAttempts } = existingIntern || {};
    const internOtpRecord7 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now7 = new Date();
    const blockTimes7 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord7?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now7);
    if (blockTimes7.length > 0) {
      const maxBlockedUntil7 = new Date(Math.max(...blockTimes7.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil7 - now7) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil7,
      });
    }
    if (otpAttempts >= 3) {
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    // let otp = String(Math.floor(1000 + Math.random() * 9000))
    let otp = generateOTP(4);

    const response = await sendWhatsAppOTP(mobileNumber, otp);
    if (!response.success) {
      return errorResponse(res, "Failed to send otp", 500);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        otpAttempts: {
          increment: 1,
        },
      },
    });
    // let body = {
    //   email,otp
    // }
    // await sendEmailOtp(body)
    return successResponse(res, {}, "Otp sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyOldMobileOtp = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { otp, mobileNumber } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "mobileNumber is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let { mobileOtp, mobileOtpExpiry } = existingIntern || {};
    const internOtpRecord8 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now8 = new Date();
    const blockTimes8 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord8?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now8);
    if (blockTimes8.length > 0) {
      const maxBlockedUntil8 = new Date(Math.max(...blockTimes8.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil8 - now8) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil8,
      });
    }

    if (mobileOtp !== otp) {
      const newAttempts = (existingIntern.otpVerifyAttempts || 0) + 1;
      const updateData = { otpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.otpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.otpVerifyAttempts = 0;
      }
      await prisma.interns.update({ where: { id }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid otp", 400);
    }
    if (mobileOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.interns.update({
      where: { id },
      data: { otpAttempts: 0, otpVerifyAttempts: 0, otpVerifyBlockedUntil: null },
    });
    return successResponse(res, {}, "Otp verified successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.sendOtpNewMobile = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { newMobileNumber } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!newMobileNumber) {
      return errorResponse(res, "New MobileNumber is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let existingMobileNumber = await prisma.interns.findFirst({
      where: {
        mobileNumber: newMobileNumber,
      },
    });
    if (existingMobileNumber) {
      return errorResponse(res, "MobileNumber already registered", 400);
    }
    let { otpAttempts } = existingIntern || {};
    const internOtpRecord9 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now9 = new Date();
    const blockTimes9 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord9?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now9);
    if (blockTimes9.length > 0) {
      const maxBlockedUntil9 = new Date(Math.max(...blockTimes9.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil9 - now9) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil9,
      });
    }
    if (otpAttempts >= 3) {
      return res.status(400).json({
        message: "Otp attempts exceeded",
        isLimitExeeded: true,
      });
    }
    // let otp = String(Math.floor(1000 + Math.random() * 9000))
    let otp = generateOTP(4);
    const response = await sendWhatsAppOTP(newMobileNumber, otp);
    if (!response.success) {
      return errorResponse(res, "Failed to send otp", 500);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        mobileOtp: otp,
        mobileOtpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        otpAttempts: {
          increment: 1,
        },
      },
    });
    // let body = {
    //   mobileNumber : newMobileNumber, otp
    // }
    // await sendEmailOtp(body)
    return successResponse(res, {}, "OTP sended successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyNewMobileAndUpdateMobile = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { otp, newMobileNumber } = req.body || {};
    if (!id) {
      return errorResponse(res, "Intern id is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "Otp is required", 400);
    }
    if (!newMobileNumber) {
      return errorResponse(res, "New mobileNumber is required", 400);
    }
    if (!validator.isUUID(id)) {
      return errorResponse(res, "Invalid id", 400);
    }
    let existingIntern = await prisma.interns.findFirst({
      where: {
        id: id,
      },
    });
    if (!existingIntern) {
      return errorResponse(res, "Intern not found", 400);
    }
    let existingMobileNumber = await prisma.interns.findFirst({
      where: {
        mobileNumber: newMobileNumber,
      },
    });

    if (existingMobileNumber) {
      return errorResponse(res, "mobilenumber already registered", 400);
    }
    let { mobileOtp, mobileOtpExpiry } = existingIntern || {};
    const internOtpRecord10 = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });
    const now10 = new Date();
    const blockTimes10 = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord10?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now10);
    if (blockTimes10.length > 0) {
      const maxBlockedUntil10 = new Date(Math.max(...blockTimes10.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil10 - now10) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: maxBlockedUntil10,
      });
    }

    if (mobileOtp !== otp) {
      const newAttempts = (existingIntern.otpVerifyAttempts || 0) + 1;
      const updateData = { otpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.otpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.otpVerifyAttempts = 0;
      }
      await prisma.interns.update({ where: { id }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid otp", 400);
    }
    if (mobileOtpExpiry < new Date()) {
      return errorResponse(res, "Otp expired", 400);
    }
    await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        mobileNumber: newMobileNumber,
        isMobileVerified: true,
        otpAttempts: 0,
        otpVerifyAttempts: 0,
        otpVerifyBlockedUntil: null,
      },
    });
    return successResponse(
      res,
      {},
      "mobilenumber updated successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.generateAboutUs = async (req, res) => {
  try {
    const { description } = req.body || {};

    if (!description) {
      return errorResponse(res, "Description is required", 400);
    }

    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 10) {
      return errorResponse(
        res,
        "Description must be at least 10 words long",
        400,
      );
    }
    if (wordCount > 100) {
      return errorResponse(
        res,
        "Description is too long, please keep it under 100 words",
        400,
      );
    }

    const prompt = `
      Reference the following short description: "${description}"
      
      Task:
      Refine this description into a professional "About Us" or "Professional Summary" for an intern's profile.
      The output should be:
      - Professional, engaging, and concise (approx. 50-80 words).
      - Written in the first person.
      - Focused on strengths, aspirations, and value proposition.
      - Suitable for a career portal.
      
      Output only the refined text, no additional commentary or labels.
    `;

    const refinedAbout = await generateInternAboutUs(prompt);

    return successResponse(res, { refinedAbout }, {}, 200);
  } catch (error) {
    console.error("Generate About Us Error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.switchToJob = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    // Check if user exists
    const existingIntern = await prisma.interns.findUnique({
      where: { id: userId },
    });

    if (!existingIntern) {
      return errorResponse(res, "User not found", 404);
    }

    // Check if already in job profile
    if (existingIntern.applicationType === "JOB") {
      return errorResponse(res, "Already in job profile", 400);
    }

    // Check if intern is blocked by any verification
    const internOtpRecord = await prisma.internOtps.findUnique({
      where: { mobileNumber: existingIntern.mobileNumber },
    });

    const now = new Date();
    const blockTimes = [
      existingIntern.emailOtpVerifyBlockedUntil,
      existingIntern.otpVerifyBlockedUntil,
      internOtpRecord?.otpVerifyBlockedUntil,
    ].filter((t) => t && t > now);

    if (blockTimes.length > 0) {
      const maxBlockedUntil = new Date(Math.max(...blockTimes.map((t) => t.getTime())));
      const minutesLeft = Math.ceil((maxBlockedUntil - now) / 60000);
      return errorResponse(
        res,
        `Action blocked due to too many incorrect OTP attempts. Try again after ${minutesLeft} minute(s).`,
        429,
      );
    }

    // Update applicationType to JOB
    const updatedIntern = await prisma.interns.update({
      where: { id: userId },
      data: { applicationType: "JOB" },
    });

    return successResponse(
      res,
      { applicationType: updatedIntern.applicationType },
      "Successfully switched to job profile",
      {},
      200,
    );
  } catch (error) {
    console.error("Switch to Job Error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};
