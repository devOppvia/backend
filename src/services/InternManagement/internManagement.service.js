const prisma = require("../../config/database");

exports.getInternBasedOnEmail = async (email)=>{
    return await prisma.interns.findUnique({
        where : {
            email : email
        }
    })
}

exports.getInternBasedOnMobileNumber = async (mobileNumber)=>{
    return await prisma.interns.findUnique({
        where : {
            mobileNumber : mobileNumber
        }
    })
}

exports.internRegistration = async (data) => {
  let {
    fullName,
    email,
    password,
    countryCode,
    mobileNumber,
    profilePicture,
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
    resume,
    profileLinks,
  } = data || {};
  return await prisma.interns.create({
    data: {
      fullName: fullName,
      email: email,
      password: password,
      countryCode: countryCode,
      mobileNumber: mobileNumber,
      profilePicture: profilePicture,
      DOB: DOB,
      gender: gender,
      city: city,
      state: state,
      country: country,
      preferedLocation: preferedLocation,
      highestQualification: highestQualification,
      collageOrUniversityName: collageOrUniversityName,
      degreeOrCourse: degreeOrCourse,
      yosOrGraduationYear: yosOrGraduationYear,
      cgpaOrPercentage: cgpaOrPercentage,
      skills: skills,
      projectDescription: projectDescription,
      resume: resume,
      profileLinks: profileLinks,
      internStatus : "APPROVED"
    },
  });
};

exports.getInternBasedOnId = async (internId)=>{
  return await prisma.interns.findFirst({
    where : {
      id : internId
    }
  })
}
