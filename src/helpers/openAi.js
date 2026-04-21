require("dotenv").config();
const prisma = require("../config/database");
const { createAICallCampaign } = require("../services/AICall/aiCall.service");
 
const API_KEY = process.env.OPENAI_KEY_TEXT_SCORE_GENERATOR;


async function generateJobAboutAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates about the job. Always respond with paragraphs with bullet dots only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // ❌ Handle API errors
    if (!response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
      console.error("❌ Empty AI response:", data);
      throw new Error("Empty AI response");
    }

    console.log("✅ RAW AI:", text);

    return text;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateJobOtherRequirementsAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates about the job. Always respond with paragraphs with bullet dots only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // ❌ Handle API errors
    if (!response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
      console.error("❌ Empty AI response:", data);
      throw new Error("Empty AI response");
    }

    console.log("✅ RAW AI:", text);

    return text;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateJobTitlesApi(prompt) {
  try {

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nReturn ONLY a valid JSON array. No explanation.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.statusText || !response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const raw = data?.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON parse failed:", raw);
      throw new Error("Invalid JSON format from AI");
    }

    console.log("✅ RAW AI:", parsed);
    return parsed;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateJobCategoryAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates category. Always respond with valid JSON arrays only.`,
          },
          {
            role: "user",
            content: `${prompt}\n\nReturn ONLY a valid JSON array. No explanation.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.statusText || !response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const raw = data?.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON parse failed:", raw);
      throw new Error("Invalid JSON format from AI");
    }

    console.log("✅ RAW AI:", parsed);
    return parsed;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateSkillsAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          
          {
            role: "user",
            content: `${prompt}\n\nReturn ONLY a valid JSON array. No explanation.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.statusText || !response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const raw = data?.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON parse failed:", raw);
      throw new Error("Invalid JSON format from AI");
    }

    console.log("✅ RAW AI:", parsed);
    return parsed;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateJobSubCategoryAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates sub category for the specified category. Always respond with valid JSON arrays only.`,
          },
          {
            role: "user",
            content: `${prompt}\n\nReturn ONLY a valid JSON array. No explanation.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.statusText || !response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const raw = data?.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON parse failed:", raw);
      throw new Error("Invalid JSON format from AI");
    }

    console.log("✅ RAW AI:", parsed);
    return parsed;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateJobScoreAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content:
              "You are a job evaluator. Based on the following internship job details, give a score between 0 and 10 where 0 means completely unqualified and 10 means excellent and ready for approval. Only return the number, no explanation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // ❌ Handle API errors
    if (!response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
      console.error("❌ Empty AI response:", data);
      throw new Error("Empty AI response");
    }

    console.log("✅ RAW AI:", text);

    return text;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateInternAboutAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates about the intern bio. Always respond with paragraphs with bullet dots only. short and professional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // ❌ Handle API errors
    if (!response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
      console.error("❌ Empty AI response:", data);
      throw new Error("Empty AI response");
    }

    console.log("✅ RAW AI:", text);

    return text;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function generateCompanyScoreAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ same model (no prefix needed)
        messages: [
          {
            role: "system",
            content:
              "You are a Company evaluator. Based on the following Company details, give a score between 0 and 10 where 0 means completely unqualified and 10 means excellent and ready for approval. Only return the number, no explanation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    // ❌ Handle API errors
    if (!response.statusText === "OK") {
      console.error("❌ OpenAI API Error:", data);
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
      console.error("❌ Empty AI response:", data);
      throw new Error("Empty AI response");
    }

    console.log("✅ RAW AI:", text);

    return text;
  } catch (error) {
    console.error("🔥 OpenAI Error:", error.message);
    throw error;
  }
}

async function GenerateInternScoreAI(
  internId,
  jobData,
  retries = 5,
  delay = 10000,
) {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      console.log(`✅ Open ai API CALLED (Attempt ${attempt + 1})`);

      const userId = internId.id;
      const jobId = jobData.id;

      let intern = await prisma.interns.findUnique({
        where: {
          id: userId,
        },
        select: {
          fullName: true,
          DOB: true,
          gender: true,
          highestQualification: true,
          collageOrUniversityName: true,
          degreeOrCourse: true,
          yosOrGraduationYear: true,
          resume: true,
          experience: true,
          industry: true,
          department: true,
          personalDetails: true,
          projectLink: true,
          internshipType: true,
          applicationType: true,
          employmentType: true,
          city: {
            select: {
              name: true,
            },
          },
          state: {
            select: {
              name: true,
            },
          },
          country: {
            select: {
              name: true,
            },
          },
        },
      });

      const internIndustry = await prisma.jobCategory.findUnique({
        where: {
          id: intern.industry[0],
        },
      });
      const internDepartment = await prisma.jobSubCategory.findUnique({
        where: {
          id: intern.department[0],
        },
      });

      const skills = await prisma.interns.findUnique({
        where: {
          id: userId,
        },
        select: {
          skills: {
            select: {
              skillName: true,
            },
          },
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
          jobCategoryId: true,
          jobSubCategory: {
            select: {
              subCategoryName: true,
            },
          },
          internshipDuration: true,
          skills: true,
          aboutJob: true,
          otherRequirements: true,
          stipend: true,
          applicationType: true,
          experience: true,
          jobType: true,
          employmentType: true,
          aiCallQuestions: true,
          callConditionScore: true,
          callEnable: true,
        },
      });

      const jobCategory = await prisma.jobCategory.findUnique({
        where: {
          id: job.jobCategoryId,
        },
        select: {
          categoryName: true,
        },
      });

      job.jobCategoryId = jobCategory.categoryName;

      const prompt = `You are an AI recruitment assistant.

Your task is to evaluate how well a candidate (intern) matches a job posting and assign a score out of 10.

JOB: ${JSON.stringify(job)}

INTERN:
${JSON.stringify(intern)}

Return ONLY JSON:
{
  "score": number (0-10),
  "reason": string
}`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // ✅ same model (no prefix needed)
            messages: [
              {
                role: "system",
                content:
                  "You are a job evaluator. Based on the following internship job details, give a score between 0 and 10 where 0 means completely unqualified and 10 means excellent and ready for approval. Only return the number, no explanation.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        },
      );

      const data = await response.json();

      

      if (!response.statusText === "OK") {
        console.error("❌ OpenAI API Error:", data);
        throw new Error(data?.error?.message || "OpenAI API error");
      }

      const text = data?.choices?.[0]?.message?.content || "";


      console.log("RAW AI:", text);

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\d+(\.\d+)?/);
        parsed = { score: match ? parseFloat(match[0]) : 0 };
      }
      const findCandidate = await prisma.candidateManagement.findFirst({
        where: {
          internId: userId,
          jobId: jobId,
        },
        select: { id: true, companyId: true },
      });

      console.log("findCandidate", findCandidate);

      if (findCandidate) {
        const update = await prisma.candidateManagement.update({
          where: {
            id: findCandidate.id,
          },
          data: {
            score: parsed.score,
            scoredReason: parsed.reason,
            isScored: true,
          },
        });
        console.log("update", update);

        if(job.callEnable && parsed.score >= job.callConditionScore){
        await createAICallCampaign({
          internId: userId,
          jobId: jobId,
          companyId: jobData.companyId,
          candidateManagementId: update.id,
          triggerScore: parsed.score,
        }).catch((err) =>
          console.error("❌ AI Call campaign creation failed:", err),
        );
        }
      }


      return {
        success: true,
        score: Math.min(Math.max(parsed.score || 0, 0), 10),
        rawResponse: text,
      };
    } catch (error) {
      console.log("error", error);
      const errorMessage = error?.message || "";
      const is503 =
        errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE");

      console.error(`❌ Attempt ${attempt + 1} failed:`, errorMessage);

      // 👉 Retry only if it's 503 / UNAVAILABLE
      if (is503 && attempt < retries) {
        attempt++;

        console.log(`🔁 Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));

        continue;
      }

      // ❌ Stop retrying for other errors
      return {
        error: true,
        success: false,
        score: null,
        message: errorMessage,
      };
    }
  }
}



module.exports = {
  generateJobAboutAI,
  generateJobTitlesApi,
  generateJobOtherRequirementsAI,
  generateCompanyScoreAI,
  generateJobSubCategoryAI,
  generateJobScoreAI,
  generateInternAboutAI,
  generateJobCategoryAI,
  generateSkillsAI,
  GenerateInternScoreAI,
};