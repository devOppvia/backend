function validateJobDescription(jobData) {
    const { aboutJob, otherRequirements, jobTitle } = jobData || {};
  
    const combinedText = `${aboutJob || ""} ${otherRequirements || ""} ${jobTitle || ""}`.toLowerCase();
  
    const rules = [
      {
        name: "Link",
        regex: /(https?:\/\/|www\.)/,
        reason: "Job description contains a website or external link."
      },
      {
        name: "Email",
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/,
        reason: "Job description contains an email address."
      },
      {
        name: "Phone",
        regex: /\b\d{10}\b/,
        reason: "Job description contains a phone number."
      },
      {
        name: "Salary Keyword",
        regex: /\b(salary|ctc|per month|lpa)\b/,
        reason: "Job description mentions salary-related terms (e.g. salary, CTC, per month, LPA)."
      },
 
    ];
  
    const violations = [];
  
    rules.forEach(rule => {
      const matches = combinedText.match(rule.regex);
      if (matches) {
        violations.push(`${rule.reason} Example: "${matches[0]}"`);
      }
    });
  
    if (violations.length > 0) {
      return {
        isValid: false,
        reasons: violations
      };
    }
  
    return {
      isValid: true,
      reasons: ["No issues found. Job description is clean."]
    };
  }

  
  module.exports = validateJobDescription