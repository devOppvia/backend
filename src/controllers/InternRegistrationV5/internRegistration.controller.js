const { app } = require("firebase-admin");
const prisma = require("../../config/database");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../../helpers/generateOTP");
const sendWhatsAppOTP = require("../../helpers/sendsma");
exports.InternRegistrationSendOtp = async (req, res) => {
  try {
    let { mobileNumber, countryCode } = req.body || {};
    if (!mobileNumber) {
      console.log("log ===> " , mobileNumber , countryCode)
      return errorResponse(res, "Mobile number is required", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }

   const checkUserExist = await prisma.interns.findUnique({
    where : {
      mobileNumber : mobileNumber,
    }
   })

  //  if(!checkUserExist){
  //   return errorResponse(res, "User not found", 400);
  //  }
   if(checkUserExist && checkUserExist?.isDelete){
    return errorResponse(res, "User is deleted", 400);
   }
   

    mobileNumber = mobileNumber.toString();
    countryCode = countryCode.toString();
    if (!countryCode.startsWith("+")) {
      countryCode = `+${countryCode}`;
    }
    let isValid = false;

    if (countryCode === "+91") {
      isValid = /^[6-9]\d{9}$/.test(mobileNumber);
      if (!isValid)
        return errorResponse(res, "Invalid Indian mobile number", 400);
    } else if (countryCode === "+1") {
      isValid = /^[2-9]\d{9}$/.test(mobileNumber);
      if (!isValid)
        return errorResponse(res, "Invalid US/Canada mobile number", 400);
    } else if (countryCode === "+44") {
      isValid = /^\d{10}$/.test(mobileNumber);
      if (!isValid) return errorResponse(res, "Invalid UK mobile number", 400);
    } else if (countryCode === "+971") {
      isValid = /^\d{9}$/.test(mobileNumber);
      if (!isValid) return errorResponse(res, "Invalid UAE mobile number", 400);
    } else if (countryCode === "+966") {
      isValid = /^5\d{8}$/.test(mobileNumber);
      if (!isValid)
        return errorResponse(res, "Invalid Saudi Arabia mobile number", 400);
    } else if (countryCode === "+977") {
      isValid = /^\d{10}$/.test(mobileNumber);
      if (!isValid)
        return errorResponse(res, "Invalid Nepal mobile number", 400);
    } else {
      return errorResponse(res, "Country code not supported", 400);
    }
    // let otp = String(Math.floor(1000 + Math.random() * 9000));
    let otp = generateOTP();
    // const response = await sendWhatsAppOTP(mobileNumber, otp)
    // console.log("whats app response ==> ", response)
    // if(!response.success){
    //   return errorResponse(res, "Failed to send OTP", 500);
    // }
    let checkUser = await prisma.internOtps.findUnique({
      where: {
        mobileNumber: mobileNumber,
      },
    });
    if (checkUser && checkUser.otpVerifyBlockedUntil && checkUser.otpVerifyBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((checkUser.otpVerifyBlockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: checkUser.otpVerifyBlockedUntil,
      });
    }
    if (checkUser) {
      await prisma.internOtps.update({
        where: {
          mobileNumber: mobileNumber,
        },
        data: {
          otp: otp,
          otpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        },
      });
    } else {
      await prisma.internOtps.create({
        data: {
          mobileNumber: mobileNumber,
          countryCode: countryCode,
          otp: otp,
          otpExpiry: new Date(Date.now() + 3 * 60 * 1000),
        },
      });
    }
    return successResponse(res, {}, "OTP sent successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    let { mobileNumber, otp } = req.body || {};
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    if (!otp) {
      return errorResponse(res, "OTP is required", 400);
    }
    mobileNumber = mobileNumber.toString();
    otp = otp.toString();
    let checkUser = await prisma.internOtps.findUnique({
      where: {
        mobileNumber: mobileNumber,
      },
    });
    if (!checkUser) {
      return errorResponse(res, "Invalid mobile number", 400);
    }

    if (checkUser.otpVerifyBlockedUntil && checkUser.otpVerifyBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((checkUser.otpVerifyBlockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Try again after ${minutesLeft} minute(s).`,
        isBlocked: true,
        blockedUntil: checkUser.otpVerifyBlockedUntil,
      });
    }

    if (checkUser.otp !== otp) {
      const newAttempts = (checkUser.otpVerifyAttempts || 0) + 1;
      const updateData = { otpVerifyAttempts: newAttempts };
      if (newAttempts >= 5) {
        updateData.otpVerifyBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.otpVerifyAttempts = 0;
      }
      await prisma.internOtps.update({ where: { mobileNumber }, data: updateData });
      if (newAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. You are blocked for 30 minutes.",
          isBlocked: true,
        });
      }
      return errorResponse(res, "Invalid OTP", 400);
    }
    if (checkUser.otpExpiry < new Date()) {
      return errorResponse(res, "OTP expired", 400);
    }
    await prisma.internOtps.update({
      where: { mobileNumber },
      data: { otpVerifyAttempts: 0, otpVerifyBlockedUntil: null },
    });
    let checkUserInDb = await prisma.interns.findUnique({
      where: {
        mobileNumber: mobileNumber,
      },
    });
    let isInternRegistered = false;
    if (checkUserInDb) {
      isInternRegistered = true;
    }
    let token;
    let refreshToken;
    let internData
    if (isInternRegistered) {
      token = jwt.sign(
        {
          id: checkUserInDb.id,
          email: checkUserInDb.email,
          mobileNumber: checkUserInDb.mobileNumber,
          fullName: checkUserInDb.fullName,
          applicationType: checkUserInDb.applicationType,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "4h",
        }
      );
       refreshToken = jwt.sign(
        {
          id: checkUserInDb.id,
          email: checkUserInDb.email,
          mobileNumber: checkUserInDb.mobileNumber,
          fullName: checkUserInDb.fullName,
          applicationType: checkUserInDb.applicationType,
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        }
      );
      internData = {
        id: checkUserInDb.id,
        fullName: checkUserInDb.fullName,
        email: checkUserInDb.email,
        countryCode: checkUserInDb.countryCode,
        mobileNumber: checkUserInDb.mobileNumber,
        applicationType: checkUserInDb.applicationType,
      }
    }
    // await prisma.interns.update({
    //   where : {
    //     mobileNumber : mobileNumber
    //   },
    //   data : {
    //     otpAttempts : 0
    //   }
    // })
    return successResponse(
      res,
      {
        accessToken: token,
        refreshToken: refreshToken,
        isInternRegistered: isInternRegistered,
        internData: internData,
      },
      "OTP verified successfully",
      {},
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.checkExistingEmail = async (req, res) => {
  try {
    let { email } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    let checkInternEmail = await prisma.interns.findUnique({
      where: {
        email: email,
      },
    });
    if (checkInternEmail) {
      return errorResponse(res, "Email already exists", 400);
    }
    return successResponse(res, true, "Email is valid", {}, 200);
  } catch (error) {
    console.error(error);
    
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.internRegistration = async (req, res) => {
  try {
    let {
      fullName,
      email,
      countryCode = "IN",
      mobileNumber,
      fcmToken,
      DOB,
      gender,
      highestQualification,
      collageOrUniversityName,
      degreeOrCourse,
      yosOrGraduationYear,
      preferredIndustries,
      preferredDepartments,
      skills,
      personalDetails,
      projectLinks,
      internshipType,
      applicationType = "INTERNSHIP",
      yearsOfExperience,
      city,
      state,
      country = "IN",
      linkedin,
      github,
      portfolio,
      preferredLocations,
      preferredStates,
      preferredAll,
      employmentType
    } = req.body || {};
    let { resume, profilePicture } = req.files || {};


    if (!fullName) {
      return errorResponse(res, "Fullname is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return errorResponse(res, "Invalid email format", 400);
    }
    if (!countryCode) {
      return errorResponse(res, "Country code is required", 400);
    }
    if (!mobileNumber) {
      return errorResponse(res, "Mobile number is required", 400);
    }
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(mobileNumber)) {
      return errorResponse(res, "Please enter a valid mobile number", 400);
    }
    if (!DOB) {
      return errorResponse(res, "DOB is required", 400);
    }
    if (!gender) {
      return errorResponse(res, "Gender is required", 400);
    }
    if (!["MALE", "FEMALE", "OTHER"].includes(gender.toUpperCase())) {
      return errorResponse(res, "Invalid gender", 400);
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
      return errorResponse(res, "YOS or graduation year is required", 400);
    }
    if (!resume) {
      return errorResponse(res, "Resume is required", 400);
    }
    if (!preferredIndustries) {
      return errorResponse(res, "Industry is required", 400);
    }
    if (!Array.isArray(preferredIndustries)) {
      preferredIndustries = [preferredIndustries];
    }
    if (!employmentType) {
      return errorResponse(res, "Employment type is required", 400);
    }
    preferredIndustries = preferredIndustries.map((i) => {
      if(i.id || i.tag){
        return  i.id || i.tag
      }
      return i.name
    })
    if (preferredIndustries.length === 0) {
      return errorResponse(res, "Industry is required", 400);
    }
    if (!preferredDepartments) {
      return errorResponse(res, "Department is required", 400);
    }
    if (!Array.isArray(preferredDepartments)) {
      preferredDepartments = [preferredDepartments];
    }
    preferredDepartments = preferredDepartments.map((d) => {
      if(d.id || d.tag){ 
        return d.id || d.tag
      }
      return d.name
    })
    if (preferredDepartments.length === 0) {
      return errorResponse(res, "Department is required", 400);
    }

    if (!internshipType) {
      return errorResponse(res, "Internship type is required", 400);
    }
    if (
      !["REMOTE", "OFFICE", "HYBRID"].includes(internshipType.toUpperCase())
    ) {
      return errorResponse(res, "Invalid internship type", 400);
    }
    // if(!applicationType){
    //   return errorResponse(res, "Application type is required", 400)
    // }
   if(!["JOB", "INTERNSHIP"].includes(applicationType)){
    return errorResponse(res, "Invalid application type", 400)
   }
    if(applicationType === "JOB"){
      if(!yearsOfExperience){
        return errorResponse(res, "Experience is required", 400)
      }
    }
    let checkExistingEmail = await prisma.interns.findUnique({
      where: {
        email: email,
      },
    });
    if (checkExistingEmail) {
      return errorResponse(res, "Email already exists", 400);
    }
    let checkExistingMobileNumber = await prisma.interns.findUnique({
      where: {
        mobileNumber: mobileNumber,
      },
    });
    if (checkExistingMobileNumber) {
      return errorResponse(res, "Mobile number already exists", 400);
    }
    if(!city || !state){
      return errorResponse(res, "City and state are required", 400)
    } 



   
    if (!Array.isArray(preferredLocations)) {
      preferredLocations = {  connect:[preferredLocations]};
    }
    preferredLocations = {
      connect : preferredLocations.map((s) => {
      if(s.id || s.tag){
        return {id : s.id || s.tag}
      }
      return s.name
    })
    }
    
        if (!skills) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(skills)) {
      skills = {connect : [skills]};
    }
    skills = {
      connect : skills.map((s) => {
      if(s.id || s.tag){
        return {id : s.id || s.tag}
      }
      return {name : s.name}
    })
    }
    if (skills.length === 0) {
      return errorResponse(res, "Skills is required", 400);
    }


      if (!preferredStates) {
      return errorResponse(res, "Skills is required", 400);
    }
    if (!Array.isArray(preferredStates)) {
      preferredStates = {  connect:[preferredStates]};
    }
    preferredStates = {
      connect : preferredStates.map((s) => {
      if(s.id || s.tag){
        return {id : s.id || s.tag}
      }
      return s.name
    })
    }
    if (preferredStates.length === 0) {
      return errorResponse(res, "Preferred states is required", 400);
    }

  
    if (projectLinks && !Array.isArray(projectLinks)) {
      projectLinks = [projectLinks];
    }
    projectLinks = projectLinks?.length > 0 ? projectLinks?.map((s) => {
      return {
        title : s.title,
        url : s.url
      }
    }) : []

    

    const countryIs = await prisma.country.findUnique({
      where : {
        iso2 : country
      }
    })

    let checkUser = await prisma.interns.create({
      data: {
        fullName: fullName,
        email: email,
        countryCode: countryCode,
        mobileNumber: mobileNumber,
        fcmToken: fcmToken,
        DOB: DOB,
        gender: gender.toUpperCase(),
        highestQualification: highestQualification,
        collageOrUniversityName: collageOrUniversityName,
        degreeOrCourse: degreeOrCourse,
        yosOrGraduationYear: yosOrGraduationYear,
        industry: preferredIndustries,
        department: preferredDepartments,
        skills: skills,
        personalDetails: personalDetails,
        projectLink: projectLinks,
        internshipType: internshipType.toUpperCase(),
        resume: resume?.[0].filename,
        profilePicture: profilePicture?.[0].filename,
        internStatus : "APPROVED",
        experience : yearsOfExperience,
        applicationType : applicationType.toUpperCase(),
        cityId : city,
        stateId : state,
          countryId : countryIs.id,
          linkedin,
          portfolio,
          github,
        preferredLocation:  preferredLocations,
        preferredStates,
        preferredAll : preferredAll === "true",
        employmentType : employmentType.toUpperCase()
      },
    });

  const token = jwt.sign(
        {
          id: checkUser.id,
          email: checkUser.email,
          mobileNumber: checkUser.mobileNumber,
          fullName: checkUser.fullName,
          applicationType: checkUser.applicationType,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "4h",
        }
      );

      const refreshToken = jwt.sign(
        {
          id: checkUser.id,
          email: checkUser.email,
          mobileNumber: checkUser.mobileNumber,
          fullName: checkUser.fullName,
          applicationType: checkUser.applicationType,
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        }
      );

     const internData = {
        id: checkUser.id,
        fullName: checkUser.fullName,
        email: checkUser.email,
        countryCode: checkUser.countryCode,
        mobileNumber: checkUser.mobileNumber,
        applicationType: checkUser.applicationType,
      }

    return successResponse(res, {accessToken : token, refreshToken , internData}, "Intern registered successfully", {}, 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
