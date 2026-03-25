const prisma = require("../../config/database");

exports.fetchCompanyById = async (companyId) => {
  return await prisma.company.findFirst({
    where: {
      id: companyId,
    },
  });
};

exports.fetchCompanyByEmail = async (email) => {
  return await prisma.company.findFirst({
    where: {
      email: email,
    },
  });
};

exports.companyRegistrationStep1 = async (
  id,
  companyName,
  email,
  designation,
  hrAndRecruiterName,
  countryCode,
  phoneNumber,
  password,
  fcmToken,
  otpEmail,
  otpMobile
) => {
  
  let result;

  console.log("passowrd is. : ==> " , password)
  if (id) {
    result = await prisma.company.update({
      where: {
        id: id,
      },
      data: {
        companyName: companyName,
        email: email,
        designation: designation,
        hrAndRecruiterName: hrAndRecruiterName,
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        password: password,
        fcmToken: fcmToken,
        emailOtp : otpEmail,
        mobileOtp : otpMobile,
        mobileOtpExpiry : new Date(Date.now() + 3 * 60 * 1000),
        emailOtpExpiry : new Date(Date.now() + 3 * 60 * 1000),
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        designation: true,
        hrAndRecruiterName: true,
        countryCode: true,
        phoneNumber: true,
        password: true,
      },
    });
  } else {
    result = await prisma.company.create({
      data: {
        companyName: companyName,
        email: email,
        designation: designation,
        hrAndRecruiterName: hrAndRecruiterName,
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        password: password,
        fcmToken: fcmToken,
        emailOtp : otpEmail,
        mobileOtp : otpMobile,
        mobileOtpExpiry : new Date(Date.now() + 3 * 60 * 1000),
        emailOtpExpiry : new Date(Date.now() + 3 * 60 * 1000),
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        designation: true,
        hrAndRecruiterName: true,
        countryCode: true,
        phoneNumber: true,
        password: true,
      },
    });
  }
  return result;
};

exports.companyRegistrationStep2 = async (
  id,
  logo,
  smallLogo,
  industryType,
  companySize,
  companyIntro,
  foundedYear,
  panOrGst,
  websiteUrl
) => {
  let result = await prisma.company.update({
    where: {
      id: id,
    },
    data: {
      logo: logo,
      smallLogo: smallLogo,
      industryType: industryType,
      companySize: companySize,
      companyIntro: companyIntro,
      foundedYear: foundedYear,
      panOrGst: panOrGst,
      websiteUrl: websiteUrl,
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      designation: true,
      hrAndRecruiterName: true,
      countryCode: true,
      phoneNumber: true,
      password: true,
      logo: true,
      smallLogo: true,
      industryType: true,
      companySize: true,
      companyIntro: true,
      foundedYear: true,
      panOrGst: true,
    },
  });
  return result;
};

exports.companyRegistrationStep3 = async (
  id,
  country,
  state,
  city,
  zipCode,
  address,
  branchLocations
) => {

  console.log("payload is : " ,{
    where: {
      id: id,
    },
    data: {
      country: country,
      state: state,
      city: city,
      zipCode: zipCode,
      address: address,
      branchLocation: branchLocations,
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      designation: true,
      hrAndRecruiterName: true,
      countryCode: true,
      phoneNumber: true,
      password: true,
      logo: true,
      smallLogo: true,
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
    },
  } )
  return await prisma.company.update({
    where: {
      id: id,
    },
    data: {
      country: country,
      state: state,
      city: city,
      zipCode: zipCode,
      address: address,
      branchLocation: branchLocations,
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      designation: true,
      hrAndRecruiterName: true,
      countryCode: true,
      phoneNumber: true,
      password: true,
      logo: true,
      smallLogo: true,
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
    },
  });
};

exports.companyRegistrationStep4 = async (
  id,
  linkdinUrl,
  instagramUrl,
  youtubeUrl,
  websiteUrl
) => {
  return await prisma.company.update({
    where: {
      id: id,
    },
    data: {
      linkdinUrl: linkdinUrl,
      instagramUrl: instagramUrl,
      youtubeUrl: youtubeUrl,
      websiteUrl: websiteUrl,
      isProfileCompleted: true,
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      designation: true,
      hrAndRecruiterName: true,
      countryCode: true,
      phoneNumber: true,
      password: true,
      logo: true,
      smallLogo: true,
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
    },
  });
};

exports.companyLogin = async (email) => {
  return await prisma.company.findFirst({
    where: {
      email: email,
      isProfileCompleted: true,
    },
  });
};

exports.forgotPassword = async (email) => {
  return await prisma.company.findFirst({
    where: {
      email: email,
      isProfileCompleted: true,
    },
  });
};

exports.resetPassword = async (id, password) => {
  return await prisma.company.update({
    where: {
      id: id,
    },
    data: {
      password: password,
    },
  });
};
