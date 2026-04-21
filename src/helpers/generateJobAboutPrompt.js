/**
 * Generate AI prompt for internship job description
 * @param {Object} jobData - Internship form data
 * @returns {string}
 */

function generateRoleTitlePrompt(industry, department, type) {
  return `Generate exactly 5 ${type} titles for the following:
Industry: ${industry}
Department: ${department}

Return ONLY a JSON array of 5 ${type} titles, nothing else. No explanations, no markdown, just the array.
Format: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`;
}

function generateJobPrompt(jobData) {
  const {
    positionTitle = "",
    category = "",
    subCategory = "",
    skillsRequired = [],
    duration = "",
    workingHours = "",
    internshipType = "",
    location = "",
    numberOfInterns = "",
    stipend = "",
    additionalBenefits = [],
  } = jobData;

  const skills =
    skillsRequired.length > 0 ? skillsRequired.join(", ") : "Not specified";
  const benefits =
    additionalBenefits.length > 0 ? additionalBenefits.join(", ") : "";

  return `Create a professional internship job description for:
  
    Internship Position: ${positionTitle}
    Category: ${category}${subCategory ? ` - ${subCategory}` : ""}
    Required Skills: ${skills}
    Duration: ${duration}
    Working Hours: ${workingHours}
    Internship Type: ${internshipType}${location ? ` in ${location}` : ""}
    Number of Interns: ${numberOfInterns}
    Stipend: ${stipend}
    ${benefits ? `Additional Benefits: ${benefits}` : ""}
  
    Write 150-200 words with:
    - Overview of the internship and company culture
    - Key responsibilities and expected contributions
    - Learning opportunities, mentorship, and skill development
    - Why this internship will be valuable for career growth
    - Encourage motivated students or fresh graduates to apply

    note not add markdown like ** and other, length of content is only 800 characters including spaces
    `;
}

function generateJobOtherRequirementsPrompt(jobData) {
  const {
    positionTitle = "",
    category = "",
    subCategory = "",
    skillsRequired = [],
    duration = "",
    workingHours = "",
    internshipType = "",
    location = "",
    numberOfInterns = "",
    stipend = "",
    additionalBenefits = [],
  } = jobData;

  const skills =
    skillsRequired.length > 0 ? skillsRequired.join(", ") : "Not specified";
  const benefits =
    additionalBenefits.length > 0 ? additionalBenefits.join(", ") : "";

  return `Create a professional internship job other requirements text for:
  
    Internship Position: ${positionTitle}
    Category: ${category}${subCategory ? ` - ${subCategory}` : ""}
    Required Skills: ${skills}
    Duration: ${duration}
    Working Hours: ${workingHours}
    Internship Type: ${internshipType}${location ? ` in ${location}` : ""}
    Number of Interns: ${numberOfInterns}
    Stipend: ${stipend}
    ${benefits ? `Additional Benefits: ${benefits}` : ""}
  
    Write 150-200 words with:
    not add markdown like ** and other, length of content is only 800 characters including spaces
   
    `;
}

function generateInternAboutUsPrompt(internData , description) {
 

  return `Create a professional intern about text for:
  
     inter data :${JSON.stringify(internData)}

     intern written about : ${description}
      

  
    Write 70-150 words with:
    note do not pass markdown like ** and other, length of content is only 400 characters including spaces
   
    `;
  
    
}
    
function generateCategoryPrompt(existingCategories, userInput) {
  return `
You are helping to create unique job category names for an Oppvia portal.

Existing categories: ${existingCategories.join(", ")}

User wants to create categories related to: "${userInput}"

Rules:
- Suggest 12 new professional job category names.
- They must not duplicate or closely resemble the existing categories.
- Keep each name concise (2-4 words).
- Output only in a valid JSON array format, e.g.: ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5", "Category 6", "Category 7", "Category 8", "Category 9", "Category 10", "Category 11", "Category 12"]
- Do not include explanations or extra text.
`;
}

function generateSubCategoryPrompt(parentCategory, existingSubCategories) {
  return `
You are a subject-matter expert in taxonomy and job-skills classification for Oppvia portals.
Given the parent category: "${parentCategory}"
And the existing subcategories (JSON array): ${JSON.stringify(existingSubCategories)}

Task:
• Propose exactly 8 new **subcategory names** that are:
  - Directly and clearly relevant to the parent category above.
  - Suitable as navigation/label names in a production Oppvia portal (short, specific, and industry-standard).
  - Each 2–4 words, Title Case (e.g., "Frontend Engineering"), and concise.
  - NOT duplicates or close synonyms of any existing subcategory. Avoid trivial variants (e.g., "Frontend Dev" vs "Frontend Development").
  - Avoid generic filler names like "Other", "Misc", "General", or "Various".
  - Prefer function/technology/process oriented names (e.g., "React Frontend", "Data Engineering", "Clinical Research Methods") where appropriate for the parent category.

Validation rule (do this internally before output):
1. Compare each candidate to the existing list and drop any candidate that:
   - Exactly matches an existing item, OR
   - Shares the same root word or is a near-synonym (e.g., "UX Design" and "User Experience Design").
2. If a candidate is rejected, replace it with another equally relevant, non-duplicative candidate.

Output format:
• Output **only** a valid JSON array of 8 strings, nothing else. Example:
  ["Subcategory 1", "Subcategory 2", ..., "Subcategory 8"]
• Do not include explanation, commentary, bullet lists, or extra punctuation outside the JSON array.
`;
}

function generateSkillsPrompt(parentCategory, subCategory, existingSkills) {
  return `
You are a subject-matter expert in workforce skills and resume-level skill-labeling.
Given:
• Parent category: "${parentCategory}"
• Subcategory: "${subCategory || "N/A"}"
• Existing skills (JSON array): ${JSON.stringify(existingSkills)}

Task:
• Propose exactly 8 new **skill names** that are:
  - Directly relevant to the parent category and specifically tailored to the subcategory when a subcategory is provided.
  - Resume-ready and actionable (what a candidate would reasonably list on their CV), e.g., "React.js Development", "Unit Testing with Jest", "Data Modeling", "API Design".
  - Specific, industry-standard, and useful for candidate filtering and job-matching (avoid vague one-word buzzwords like "Hardworking").
  - 2–4 words, Title Case or common official stylings (e.g., "Machine Learning Engineering", "UX Research Methods").
  - NOT duplicates or near-synonyms of any skill in the existingSkills list.
  - Prefer tangible skills (tools, technologies, methods, frameworks, protocols, practices) over generic soft skills. If a soft skill is suggested, make it specific (e.g., "Cross-Functional Communication" rather than "Communication").

Validation rule (do this internally before output):
1. Reject any suggestion that exactly matches or is a near-synonym of an existing skill.
2. If the provided subcategory is specific (not "N/A"), bias suggestions toward practical, hands-on skills used in that subcategory.
3. Ensure diversity across the 8 items (tooling, methods, architectures, or technique names rather than repeated forms of the same core skill).

Output format:
• Output **only** a valid JSON array of 8 strings, nothing else. Example:
  ["Skill 1", "Skill 2", ..., "Skill 8"]
• No additional commentary or text outside the JSON array.
`;
}

function generateJobEvaluationPrompt(jobData) {
  const {
    jobTitle,
    internshipDuration,
    workingHours,
    skills,
    aboutJob,
    otherRequirements,
    numberOfOpenings,
    location,
    stipend,
    minStipend,
    maxStipend,
    additionalBenefits,
    jobType,
    jobCategory,
    jobSubCategory,
  } = jobData || {};

  return `
  You are a job evaluator. 
  Based on the following internship job details, give a score between 0 and 10 
  where 0 means completely unqualified and 10 means excellent and ready for approval.
  Only return the number, no explanation.
  
  Job Details:
  Job Title: ${jobTitle || "N/A"}
  Internship Duration: ${internshipDuration || "N/A"}
  Working Hours: ${workingHours || "N/A"}
  Skills: ${skills && skills.length ? skills.join(", ") : "N/A"}
  About Job: ${aboutJob || "N/A"}
  Other Requirements: ${otherRequirements || "N/A"}
  Number of Openings: ${numberOfOpenings || "N/A"}
  Location: ${location || "N/A"}
  Stipend: ${stipend || "N/A"} (Min: ${minStipend || "N/A"}, Max: ${
    maxStipend || "N/A"
  })
  Additional Benefits: ${additionalBenefits || "N/A"}
  Job Type: ${jobType || "N/A"}
  Category: ${jobCategory?.categoryName || "N/A"}
  SubCategory: ${jobSubCategory?.subCategoryName || "N/A"}
  `;
}

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
  } else if (
    typeof branchLocation === "string" &&
    branchLocation.trim() !== ""
  ) {
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




module.exports = {
  generateJobPrompt,
  generateCategoryPrompt,
  generateSubCategoryPrompt,
  generateSkillsPrompt,
  generateJobOtherRequirementsPrompt,
  generateInternAboutUsPrompt,
  generateRoleTitlePrompt,
  generateJobEvaluationPrompt,
  generateCompanyEvaluationPrompt,
};
