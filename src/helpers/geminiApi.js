const API_KEY = "AIzaSyDPd6ccb1SOudnfTUtrvn_PBqnPSFJ2-lA";
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Call Gemini AI API
 * @param {string} prompt - Text prompt for AI
 * @returns {Promise<string>} AI response text
 */
async function callGeminiAPI(prompt) {
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

module.exports = {
  callGeminiAPI,
  GenerateNewJobCategories,
  GenerateNewJobSubCategory,
  GenerateNewSkills,
  GenerateJobScoreDetails,
  GenerateCompanyScore
};
