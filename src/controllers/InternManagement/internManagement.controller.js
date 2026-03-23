const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const internManagementServices = require("../../services/InternManagement/internManagement.service");
const validateEmail = require("../../validations/validateEmail");
const validatePassword = require("../../validations/validatePassword");
exports.internRegistration = async (req, res) => {
  try {
    let {
      fullName,
      email,
      password,
      countryCode,
      mobileNumber,
      DOB,
      gender,
      city,
      state,
      country,
      preferedLocation,
      highestQualification,
      collageOrUniversityName,
      degreeOrCourse,
      yosOrGraduationYear,
      cgpaOrPercentage,
      skills,
      projectDescription,
      profileLinks,
    } = req.body || {};
    let { profilePicture, resume } = req.files || {};
    if (!fullName) {
      return errorResponse(res, "Fullname is required", 400);
    }
    fullName = fullName.trim();
    if (fullName.length < 3) {
      return errorResponse(res, "Fullname must be at least 3 characters", 400);
    }
    if (fullName.length > 15) {
      return errorResponse(
        res,
        "Fullname must be less than 15 characters",
        400
      );
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!validateEmail(email)) {
      return errorResponse(res, "Email is not valid", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    if (!validatePassword(password)) {
      return errorResponse(
        res,
        "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        400
      );
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    if (!DOB) {
      return errorResponse(res, "Date of birth is required", 400);
    }
    if (!gender) {
      return errorResponse(res, "Gender is required", 400);
    }
    if (gender) {
      let validGender = ["Male", "Female", "Other"];
      if (!validGender.includes(gender)) {
        return errorResponse(
          res,
          "Gender must be either Male, Female or Other",
          400
        );
      }
    }
    if (!city) {
      return errorResponse(res, "City is required", 400);
    }
    if (!state) {
      return errorResponse(res, "State is required", 400);
    }
    if (!country) {
      return errorResponse(res, "Country is required", 400);
    }
    if (!preferedLocation) {
      return errorResponse(res, "Prefered location is required", 400);
    }
    if (!Array.isArray(preferedLocation)) {
      return errorResponse(res, "Prefered location must be an array", 400);
    }
    if (!highestQualification) {
      return errorResponse(res, "Highest qualification is required", 400);
    }
    if (!collageOrUniversityName) {
      return errorResponse(res, "Collage or university name is required", 400);
    }
    if (!degreeOrCourse) {
      return errorResponse(res, "Degree or course is required", 400);
    }
    if (!yosOrGraduationYear) {
      return errorResponse(
        res,
        "Year of study or graduation year is required",
        400
      );
    }
    if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(skills)) {
      return errorResponse(res, "Skills must be an array", 400);
    }
    if (!projectDescription) {
      return errorResponse(res, "Project description is required", 400);
    }
    if (!resume) {
      return errorResponse(res, "Resume is required", 400);
    }
    if (profileLinks) {
      if (!Array.isArray(profileLinks)) {
        return errorResponse(res, "Profile links must be an array", 400);
      }
    }
    if(resume[0].mimetype !== "application/pdf"){
      return errorResponse(res, "Resume must be a pdf file", 400);
    }
    if(profilePicture[0].mimetype !== "image/png"){
        return errorResponse(res, "Profile picture must be a png file", 400)
    }
    let existingEmail = await internManagementServices.getInternBasedOnEmail(
      email
    );
    if (existingEmail) {
      return errorResponse(res, "Email already exists", 409);
    }
    let existingMobileNumber =
      await internManagementServices.getInternBasedOnMobileNumber(mobileNumber);
    if (existingMobileNumber) {
      return errorResponse(res, "Mobile number already exists", 409);
    }
    await internManagementServices.internRegistration({
      fullName,
      email,
      password,
      countryCode,
      mobileNumber,
      profilePicture : profilePicture?.[0]?.filename,
      DOB,
      gender,
      city,
      state,
      country,
      preferedLocation,
      highestQualification,
      collageOrUniversityName,
      degreeOrCourse,
      yosOrGraduationYear,
      cgpaOrPercentage,
      skills,
      projectDescription,
      resume : resume?.[0]?.filename,
      profileLinks
  });

    return successResponse(res, {}, "Intern registered successfully");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};
