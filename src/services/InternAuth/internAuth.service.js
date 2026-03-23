const prisma = require("../../config/database");

exports.fetchInternById = async (internId) => {
  return await prisma.interns.findFirst({
    where: {
      id: internId,
    },
  });
};

exports.fetchInternByEmail = async (email, id = null) => {
  return await prisma.interns.findFirst({
    where: {
      email: email,
      ...(id && { id: { not: id } }),
    },
  });
};

exports.fetchInternByMobileNumber = async (mobileNumber, id = null) => {
  return await prisma.interns.findFirst({
    where: {
      mobileNumber: mobileNumber,
      ...(id && { id: { not: id } }),
    },
  });
};

exports.InternRegistrationStep1 = async (
  fullName,
  email,
  countryCode,
  mobileNumber,
  password,
  profile_picture,
  id,
  otp
) => {
  
  let result;
  if (id) {
    result = await prisma.interns.update({
      where: {
        id: id,
      },
      data: {
        fullName: fullName,
        email: email,
        countryCode: countryCode,
        mobileNumber: mobileNumber,
        password: password,
        profilePicture: profile_picture,
        mobileOtp : otp,
        isMobileVerified : false,
        mobileOtpExpiry : new Date(Date.now() + 3 * 60 * 1000)
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        password: true,
        countryCode: true,
        mobileNumber: true,
        profilePicture: true,
      },
    });
  } else {
    result = await prisma.interns.create({
      data: {
        fullName: fullName,
        email: email,
        countryCode: countryCode,
        mobileNumber: mobileNumber,
        password: password,
        profilePicture: profile_picture,
        mobileOtp : otp,
        isMobileVerified : false,
        mobileOtpExpiry : new Date(Date.now() + 3 * 60 * 1000)

      },
      select: {
        id: true,
        fullName: true,
        email: true,
        password: true,
        countryCode: true,
        mobileNumber: true,
        profilePicture: true,
      },
    });
  }
  return result;
};

exports.InternRegistrationStep2 = async (
  id,
  DOB,
  gender,
  country,
  state,
  city,
  preferedLocation
) => {
  return await prisma.interns.update({
    where: {
      id: id,
    },
    data: {
      DOB: DOB,
      gender: gender,
      country: country,
      state: state,
      city: city,
      preferedLocation: preferedLocation,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      password: true,
      countryCode: true,
      mobileNumber: true,
      profilePicture: true,
      DOB: true,
      gender: true,
      country: true,
      state: true,
      city: true,
      preferedLocation: true,
    },
  });
};

exports.InternRegistrationStep3 = async (
  id,
  highestQualification,
  collageOrUniversityName,
  degreeOrCourse,
  yosOrGraduationYear,
  cgpaOrPercentage
) => {
  return await prisma.interns.update({
    where: {
      id: id,
    },
    data: {
      highestQualification: highestQualification,
      collageOrUniversityName: collageOrUniversityName,
      degreeOrCourse: degreeOrCourse,
      yosOrGraduationYear: yosOrGraduationYear,
      cgpaOrPercentage: cgpaOrPercentage,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      password: true,
      countryCode: true,
      mobileNumber: true,
      profilePicture: true,
      DOB: true,
      gender: true,
      country: true,
      state: true,
      city: true,
      preferedLocation: true,
      highestQualification: true,
      collageOrUniversityName: true,
      degreeOrCourse: true,
      yosOrGraduationYear: true,
      cgpaOrPercentage: true,
    },
  });
};

exports.InternRegistrationStep4 = async (
  id,
  industry,
  department,
  skills,
  projectLinks,
  internAbout,
  resume
) => {
  return await prisma.interns.update({
    where: {
      id: id,
    },
    data: {
      industry: industry,
      department: department,
      industryType: industry,
      skills: skills,
      profileLinks: projectLinks,
      resume: resume,
      internAbout: internAbout,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      password: true,
      countryCode: true,
      mobileNumber: true,
      profilePicture: true,
      DOB: true,
      gender: true,
      country: true,
      internAbout: true,
      state: true,
      city: true,
      preferedLocation: true,
      highestQualification: true,
      collageOrUniversityName: true,
      degreeOrCourse: true,
      yosOrGraduationYear: true,
      cgpaOrPercentage: true,
      industry: true,
      department: true,
      skills: true,
      profileLinks: true,
      resume: true,
    },
  });
};

exports.InternRegistrationStep5 = async (
  id,
  internshipType,
  durationPreference,
  language
) => {
  return await prisma.interns.update({
    where: {
      id: id,
    },
    data: {
      internshipType: internshipType,
      durationPreference: durationPreference,
      language: language,
      isProfileComplate: true,
      internStatus: "APPROVED",
    },
  });
};

exports.getInternBasedOnEmail = async (email) => {
  return await prisma.interns.findFirst({
    where: {
      email: email,
    },
  });
};

exports.getInternJobProfileDetailsBasedOnId = async (internId) => {
  
  let intern = await prisma.interns.findFirst({
    where: {
      id: internId,
      // internStatus: "APPROVED",
      isDelete: false,
      isProfileComplate: true,
    },
    select: {
      id: true,
      resume: true,
      
      // country: true,
      // state: true,
      // city: true,
      // preferedLocation: true,
      industry: true,
      // jobCategory: {
      //   select: {
      //     id: true,
      //     categoryName: true,
      //   },
      // },
      // jobSubCategory: {
      //   select: {
      //     id: true,
      //     subCategoryName: true,
      //   },
      // },
      department: true,
      skills: true,
      highestQualification: true,
      degreeOrCourse: true,
      collageOrUniversityName: true,
      yosOrGraduationYear: true,
      preferredLocation : true,
      preferredStates : true,
      linkedin : true,
      portfolio : true ,
      github : true,
      projectLink :  true,
      employmentType : true,
      
      // cgpaOrPercentage: true,
      internshipType: true,
      // durationPreference: true,
      // language: true,
    },
  });
  if(intern){
    let industry = intern.industry
    let department = intern.department
    let jobCategory = await prisma.jobCategory.findMany({
      where : {
        id : {
          in : industry.id
        },
      },
      select : {
        id : true,
        categoryName : true
      }
    })
    let jobSubCategory = await prisma.jobSubCategory.findMany({
      where : {
        id : {
          in : department.id
        }
      },
      select : {
        id : true,
        subCategoryName : true
      }
    })
    intern = { ...intern, jobCategory, jobSubCategory}
  }
  return intern
};

exports.getInternProfileBasedOnId = async (internId) => {
  let data =  await prisma.interns.findFirst({
    where: {
      id: internId,
      // internStatus: "APPROVED",
      isDelete: false,
      isProfileComplate: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      countryCode: true,
      mobileNumber: true,
      profilePicture: true, 
      isEmailVerified : true,
      isMobileVerified : true,
      stateId : true,
      cityId : true,
      countryId : true,
      isOpenToWork : true,
      applicationType :  true
    
    },
  });

  if(data){
    let country = await prisma.country.findFirst({
      where : {
        id : data.countryId
      },
      select : {
        id : true,
        name : true
      }
    })
    let state = await prisma.state.findFirst({
      where : {
        id : data.stateId
      },
      select : {
        id : true,
        name : true
      }
    })
    let city = await prisma.city.findFirst({
      where : {
        id : data.city
      },
      select : {
        id : true,
        name : true
      }
    })
    data = { ...data, country, state, city}
  }
  return data
};
