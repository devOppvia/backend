function generateCompanyEvaluationPrompt(companyData) {
  const {
    companyName,
    email,
    designation,
    hrAndRecruiterName,
    phoneNumber,
    countryCode,
    logo,
    smallLogo,
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
    isProfileCompleted,
  } = companyData || {};
  let branchLocationsText = "N/A";

  if (Array.isArray(branchLocation) && branchLocation.length > 0) {
    branchLocationsText = branchLocation.join(", ");
  } else if (typeof branchLocation === "string" && branchLocation.trim() !== "") {
    branchLocationsText = branchLocation;
  } else if (branchLocation && typeof branchLocation === "object") {
    branchLocationsText = Object.values(branchLocation).join(", ");
  }
  return `
    You are a company verification evaluator for an admin approval system.
    Based on the following company registration details, give a score between 0 and 10 
    where 0 means completely unqualified/suspicious and 10 means excellent, legitimate, and ready for immediate approval.
    
    Evaluation Criteria:
    - Profile completeness and data quality
    - Business legitimacy (valid PAN/GST, website, social presence)
    - Contact information validity (email domain, phone format)
    - Company information consistency
    - Professional presentation (logo, description)
    - Established presence (founded year, company size, branches)
    
    Only return a single number between 0-10, no explanation.
    
    Company Registration Details:
    
    Basic Information:
    Company Name: ${companyName || "N/A"}
    HR/Recruiter Name: ${hrAndRecruiterName || "N/A"}
    Designation: ${designation || "N/A"}
    Email: ${email || "N/A"}
    Phone: ${countryCode || "N/A"} ${phoneNumber || "N/A"}
    
    Business Details:
    Industry Type: ${industryType || "N/A"}
    Company Size: ${companySize || "N/A"} employees
    Founded Year: ${foundedYear || "N/A"}
    PAN/GST Number: ${panOrGst || "N/A"}
    
    Company Description:
    ${companyIntro || "N/A"}
    
    Location Details:
    Address: ${address || "N/A"}
    City: ${city || "N/A"}
    State: ${state || "N/A"}
    Country: ${country || "N/A"}
    Zip Code: ${zipCode || "N/A"}
    Branch Locations: ${branchLocationsText || "N/A"}
    
    Online Presence:
    Website: ${websiteUrl || "N/A"}
    LinkedIn: ${linkdinUrl || "N/A"}
    Instagram: ${instagramUrl || "N/A"}
    YouTube: ${youtubeUrl || "N/A"}
    
    Media Assets:
    Logo Provided: ${logo ? "Yes" : "No"}
    Small Logo Provided: ${smallLogo ? "Yes" : "No"}
    
    Profile Status:
    Profile Completed: ${isProfileCompleted ? "Yes" : "No"}
    
    Note: Consider the following as red flags (lower score):
    - Missing critical fields (company name, email, PAN/GST)
    - Invalid/suspicious email domains (e.g., generic gmail, temporary emails)
    - No website or social media presence
    - Incomplete profile
    - Very recent founded year with large company size claims
    - Missing or low-quality logo
    - Inconsistent or unprofessional information
    `;
}

module.exports = { generateCompanyEvaluationPrompt };
