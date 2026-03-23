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

module.exports = { generateJobEvaluationPrompt };
