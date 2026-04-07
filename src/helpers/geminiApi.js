const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");
const prisma = require("../config/database");
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const ai = new GoogleGenAI({});

  
/**
 * Call Gemini AI API
 * @param {string} prompt - Text prompt for AI
 * @returns {Promise<string>} AI response text
 */
async function callGeminiAPI(prompt) {
  console.log("api key", API_KEY);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API call failed");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    // console.error("Gemini API Error:", error);
    throw error;
  }
}


async function GenerateNewJobCategories(prompt, retries = 3, delay = 2000) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API call failed");
    }

    return data.candidates[0]?.content?.parts[0]?.text || "[]";
  } catch (error) {
    // console.error("Gemini API Error:", error.message);

    if (retries > 0 && error.message.includes("overloaded")) {
      console.warn(`Gemini overloaded. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return GenerateNewJobCategories(prompt, retries - 1, delay * 2);
    }

    throw error;
  }
}

async function GenerateNewJobSubCategory(prompt, retries = 1, delay = 2000) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API call failed");
    }

    return data.candidates[0].content.parts[0].text || "[]";
  } catch (error) {
    // console.error("Gemini API Error:", error.message);

    if (retries > 0 && error.message.includes("quota")) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return GenerateNewJobSubCategory(prompt, retries - 1, delay * 2);
    }

    throw error; 
  }
}


async function GenerateNewSkills(prompt, retries = 3, delay = 2000) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      
      if (data.error?.message?.includes("quota")) {
        throw new Error("QUOTA_EXCEEDED");
      }
      throw new Error(data.error?.message || "API call failed");
    }

    return data.candidates[0].content.parts[0].text || "[]";
  } catch (error) {
    // console.error("Gemini API Error:", error.message);
    
    if (error.message === "QUOTA_EXCEEDED") {
      return {
        error: true,
        message:
          "Gemini API quota exceeded. Please upgrade your plan or try again later.",
      };
    }

    if (retries > 0 && error.message.includes("overloaded")) {
      console.warn(`Gemini overloaded. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return GenerateNewSkills(prompt, retries - 1, delay * 2);
    }
    if(error.error ){
      return {
        error: true,
        message: error.message || "Failed to generate skills. Please try again later.",
      };
    }
    throw {
      error: true,
      message:
        error.message || "Failed to generate skills. Please try again later.",
    };
  }
}

async function GenerateJobScoreDetails(prompt, retries = 1, delay = 2000) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API call failed");
    }

    let score = data.candidates[0].content.parts[0].text.trim();
    return parseInt(score, 10) || 0;
  } catch (error) {
    // console.error("Gemini API Error (Score):", error.message);

    if (retries > 0 && error.message.includes("quota")) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return GenerateJobScoreDetails(prompt, retries - 1, delay * 2);
    }

    throw error;
  }
}


async function GenerateCompanyScore(prompt, retries = 3, delay = 2000) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 10,
          topP: 0.8,
          topK: 10
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.message?.includes("quota")) {
        throw new Error("QUOTA_EXCEEDED");
      }
      throw new Error(data.error?.message || "API call failed");
    }

    const scoreText = data.candidates[0].content.parts[0].text || "0";
    
    const scoreMatch = scoreText.match(/\d+(\.\d+)?/);
    const score = scoreMatch ? parseFloat(scoreMatch[0]) : 0;
    
    const validScore = Math.min(Math.max(score, 0), 10);
    
    return {
      success: true,
      score: validScore,
      rawResponse: scoreText
    };

  } catch (error) {
    // console.error("Gemini API Error:", error.message);

    if (error.message === "QUOTA_EXCEEDED") {
      return {
        error: true,
        success: false,
        score: null,
        message:
          "Gemini API quota exceeded. Please upgrade your plan or try again later.",
      };
    }

    if (retries > 0 && error.message.includes("overloaded")) {
      console.warn(`Gemini overloaded. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return GenerateCompanyScore(companyData, retries - 1, delay * 2);
    }
    
    return {
      error: true,
      success: false,
      score: null,
      message:
        error.message || "Failed to generate company score. Please try again later.",
    };
  }
}



async function GenerateInternScore(
  internId,
  jobData,
  retries = 3,
  delay = 10000,
) {
  try {
    console.log("✅ GEMINI API CALLED");

   const userId = internId.id;
   const jobId  = jobData.id;

  
   let intern = await prisma.interns.findUnique({
    where: {
      id: userId
    },
    select : {
      fullName : true,
      DOB : true,
      gender : true,
      highestQualification : true,
      collageOrUniversityName : true,
      degreeOrCourse : true,
      yosOrGraduationYear : true,
      resume : true,
      experience : true,
      industry : true,
      department : true,
      personalDetails : true,
      projectLink : true,
      internshipType : true,
      applicationType : true,
      employmentType : true,
      city : {
        select : {
          name : true,
        }
      },
      state : {
        select : {
          name : true,
        }
      },
      country : {
        select : {
          name : true,
        }
      }
        
    }
   })

   const internIndustry = await prisma.jobCategory.findUnique({
    where: {
      id: intern.industry[0]
     } }
  )
  const internDepartment = await prisma.jobSubCategory.findUnique({
    where: {
      id: intern.department[0]
    }
  })

  const skills = await prisma.interns.findUnique({
    where: {
      id: userId,
    },
    select: {
     skills : {
      select : {
        skillName : true
      }
     }
    },
  });

   intern.industry = internIndustry.categoryName;
   intern.department = internDepartment.subCategoryName;
   intern.skills = skills.skills.map((skill) => skill.skillName);
  //  console.log("intern ==>", intern);

   

const job = await prisma.job.findUnique({
  where: {
    id: jobId,
  },
  select: {
    jobTitle: true,
    jobCategoryId : true,
    jobSubCategory : {
      select : {
        subCategoryName : true,
      }
    }, 
    internshipDuration : true,
    skills : true,
    aboutJob : true,
    otherRequirements : true,
    stipend : true,
    applicationType : true,
    experience : true,
    jobType : true,
    employmentType : true,
  },
});

const jobCategory = await prisma.jobCategory.findUnique({
  where: {
    id: job.jobCategoryId,
  },
  select : {
    categoryName : true,
  }
})

 job.jobCategoryId = jobCategory.categoryName;





    const prompt = `You are an AI recruitment assistant.

Your task is to evaluate how well a candidate (intern) matches a job posting and assign a score out of 10.

JOB: ${JSON.stringify(job)}

INTERN:
${JSON.stringify(intern)}

Return ONLY JSON:
{
  "score": number (0-10)
  "reason": string
}`;




   const response = await ai.models.generateContent({
     model: "gemini-3-flash-preview",
     contents: prompt,
   });

   // console.log("response", response.candidates[0].content);
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("RAW AI:", text);

    // Extract JSON safely
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\d+(\.\d+)?/);
      parsed = { score: match ? parseFloat(match[0]) : 0 };
    }

    return {
      success: true,
      score: Math.min(Math.max(parsed.score || 0, 0), 10),
      rawResponse: text,
    };
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);

    return {
      error: true,
      success: false,
      score: null,
      message: error.message,
    };
  }
}


module.exports = {
  callGeminiAPI,
  GenerateNewJobCategories,
  GenerateNewJobSubCategory,
  GenerateNewSkills,
  GenerateJobScoreDetails,
  GenerateCompanyScore,
  GenerateInternScore,
};
