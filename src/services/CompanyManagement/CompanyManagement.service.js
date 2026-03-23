const prisma = require("../../config/database");

exports.getCompanyDetailsById = async (companyId) => {
  return await prisma.company.findUnique({
    where: {
      id: companyId,
    },
  });
};

exports.companyRegistration = async (
  companyName,
  industry,
  websiteUrl,
  address,
  hrAndRecruiterName,
  email,
  phoneNumber,
  countryCode,
  companyIntro,
  logo,
  companyStatus,
  isDelete
) => {
  return await prisma.company.create({
    data: {
      companyName: companyName,
      industry: industry,
      websiteUrl: websiteUrl,
      address: address,
      hrAndRecruiterName: hrAndRecruiterName,
      email: email,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      companyIntro: companyIntro,
      logo: logo,
      companyStatus: "PENDING",
      isDelete: false,
    },
  });
};

exports.getAllRegisteredCompaniesBasedOnStatus = async (companyStatus) => {
  return await prisma.company.findMany({
    where: {
      companyStatus: companyStatus,
      isDelete: false,
      isProfileCompleted: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

exports.getCompanyDetailsBasedOnCompanyId = async (companyId) => {
  return await prisma.company.findUnique({
    where: {
      id: companyId,
      isDelete: false,
    },
    select: {
      id: true,
      companyName: true,
      websiteUrl: true,
      address: true,
      hrAndRecruiterName: true,
      companyIntro : true,
      email: true,
      phoneNumber: true,
      countryCode: true,
      logo: true,
      smallLogo : true,
      companyStatus: true,
      createdAt: true,
      industryType: true,
    },
  });
};

exports.updateCompanyStatus = async (companyId, companyStatus,reason) => {
  return await prisma.company.update({
    where: {
      id: companyId,
    },
    data: {
      companyStatus: companyStatus,
      rejectReason : reason
    },
  });
};

exports.updateCompanyDetails = async (
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
  logo
) => {
  return await prisma.company.update({
    where: {
      id: id,
    },
    data: {
      companyName: companyName,
      industry: industry,
      websiteUrl: websiteUrl,
      address: address,
      hrAndRecruiterName: hrAndRecruiterName,
      email: email,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      companyIntro: companyIntro,
      logo: logo,
    },
  });
};

exports.deleteCompanyDetail = async (companyId) => {
  return await prisma.company.update({
    where: {
      id: companyId,
    },
    data: {
      isDelete: true,
    },
  });
};

exports.companyRegistrationStep1 = async (data) => {
  const { companyName, email, personDesignation, personName, password } =
    data || {};
  return await prisma.companyRegistrationDraft.create({
    data: {
      companyName: companyName,
      email: email,
      personDesignation: personDesignation,
      personName: personName,
      password: password,
    },
  });
};

exports.companyRegistrationStep2 = async (draftId, data) => {
  const {
    companyLogo,
    companySortLogo,
    industryType,
    companySize,
    description,
    panGst,
  } = data || {};
  return await prisma.companyRegistrationDraft.update({
    where: {
      id: draftId,
    },
    data: {
      companyLogo: companyLogo,
      companySortLogo: companySortLogo,
      industryType: industryType,
      companySize: companySize,
      description: description,
      panGst: panGst,
    },
  });
};

exports.companyRegistrationStep3 = async (draftId, data) => {
  const { country, state, city, pincode, headOfficeAddress, branchOffices } =
    data || {};
  return await prisma.companyRegistrationDraft.update({
    where: {
      id: draftId,
    },
    data: {
      country: country,
      state: state,
      city: city,
      pincode: pincode,
      headOfficeAddress: headOfficeAddress,
      branchOffices: branchOffices,
    },
  });
};

exports.companyRegistrationStep4 = async (draftId, data) => {
  const { linkedinUrl, instagramUrl, youtubeUrl } = data || {};
  const draft = await prisma.companyRegistrationDraft.update({
    where: { id: draftId },
    data: {
      linkedinUrl: linkedinUrl,
      instagramUrl: instagramUrl,
      youtubeUrl: youtubeUrl,
      registrationStep: 4,
      isCompleted: true,
    },
  });

  await prisma.company.create({
    data: {
      companyName: draft.companyName,
      email: draft.email,
      industry: draft.industryType,
      websiteUrl: draft.youtubeUrl,
      address: draft.headOfficeAddress,
      hrAndRecruiterName: draft.personName,
      phoneNumber: draft.personName,
      countryCode: "+941",
      companyIntro: draft.description,
      logo: draft.companyLogo,
    },
  });

  await prisma.companyRegistrationDraft.delete({ where: { id: draftId } });

  return true;
};

exports.getCompanyProfileDataBasedOnId = async (companyId) => {
  return await prisma.company.findFirst({
    where: {
      id: companyId,
      isDelete: false,
      isProfileCompleted: true,
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      designation: true,
      companyIndustry: {
        select: {
          id: true,
          categoryName: true,
        },
      },
      industryType : true,
      hrAndRecruiterName: true,
      countryCode: true,
      phoneNumber: true,
      logo: true,
      smallLogo: true,
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

exports.updateCompanyProfile = async (
  companyId,
  data,
  companyLogo,
  companySmallLogo
) => {
  let {
    companyName,
    email,
    designation,
    hrAndRecruiterName,
    countryCode,
    phoneNumber,
    industryType,
    companySize,
    companyIntro,
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
  } = data || {};
 
  let branchArray = [];

  if (branchLocation) {
    if (Array.isArray(branchLocation)) {
      branchArray = branchLocation.map((b) =>
        typeof b === "string" ? b.trim() : String(b)
      );
    } else if (typeof branchLocation === "string") {
      try {
        const parsed = JSON.parse(branchLocation);
        branchArray = Array.isArray(parsed) ? parsed : [branchLocation.trim()];
      } catch (e) {
        branchArray = branchLocation.includes(",")
          ? branchLocation.split(",").map((b) => b.trim())
          : [branchLocation.trim()];
      }
    } else if (typeof branchLocation === "object") {
      branchArray = Object.values(branchLocation).map((b) => String(b).trim());
    }
  }
  let originalCompany = await prisma.company.findFirst({
    where : {
      id : companyId
    }
  })
  let { createdAt,foundedYear, panOrGst } = originalCompany || {}
  let existingCompanyRequest = await prisma.companyUpdateRequests.findFirst({
    where : {
      companyId : companyId
    }
  })
  console.log("PAYLOAD FOR UPDATE IS " , {
        id : companyId,
        companyName: companyName,
        email: email,
        designation: designation,
        hrAndRecruiterName: hrAndRecruiterName,
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        foundedYear : foundedYear,
        panOrGst : panOrGst,
        industryType: industryType,
        companySize: companySize,
        companyIntro: companyIntro,
        country: country,
        state: state,
        city: city,
        zipCode: zipCode,
        address: address,
        branchLocation: branchArray,
        linkdinUrl: linkdinUrl,
        instagramUrl: instagramUrl,
        youtubeUrl: youtubeUrl,
        websiteUrl: websiteUrl,
        logo: companyLogo,
        smallLogo: companySmallLogo,
        AiScore : "0",
        companyStatus : "PENDING",
        createdAt : createdAt
      })
  let company = null
  if(existingCompanyRequest){
    console.log("IN SIDE IT EXISTING 1")
    company = await prisma.companyUpdateRequests.update({
      where: {
        id: existingCompanyRequest.id,
      },
      data: {
        id : companyId,
        companyName: companyName,
        email: email,
        designation: designation,
        hrAndRecruiterName: hrAndRecruiterName,
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        foundedYear : foundedYear,
        panOrGst : panOrGst,
        industryType: industryType,
        companySize: companySize,
        companyIntro: companyIntro,
        country: country,
        state: state,
        city: city,
        zipCode: zipCode,
        address: address,
        branchLocation: branchArray,
        linkdinUrl: linkdinUrl,
        instagramUrl: instagramUrl,
        youtubeUrl: youtubeUrl,
        websiteUrl: websiteUrl,
        logo: companyLogo,
        smallLogo: companySmallLogo,
        AiScore : "0",
        companyStatus : "PENDING",
        createdAt : createdAt
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        designation: true,
        hrAndRecruiterName: true,
        countryCode: true,
        phoneNumber: true,
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
  }else{
    console.log("IN SIDE IT ELSE 1")
    company = await prisma.companyUpdateRequests.create({
      data: {
        id : companyId,
        companyName: companyName,
        email: email,
        designation: designation,
        hrAndRecruiterName: hrAndRecruiterName,
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        industryType: industryType,
        companySize: companySize,
        companyIntro: companyIntro,
        country: country,
        state: state,
        city: city,
        zipCode: zipCode,
        address: address,
        branchLocation: branchArray,
        linkdinUrl: linkdinUrl,
        instagramUrl: instagramUrl,
        youtubeUrl: youtubeUrl,
        websiteUrl: websiteUrl,
        logo: companyLogo,
        smallLogo: companySmallLogo,
        AiScore : "0",
        companyStatus : "PENDING",
        companyId : companyId
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        designation: true,
        hrAndRecruiterName: true,
        countryCode: true,
        phoneNumber: true,
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
    })
  }
  return company
};

exports.getCompanyIndustries = async ()=>{
  return await prisma.jobCategory.findMany({
    where : {
      isDelete : false
    },
    orderBy : {
      createdAt : "desc"
    },
    select : {
      id : true,
      categoryName : true
    }
  })
}
