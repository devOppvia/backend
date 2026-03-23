
const axios = require("axios");

const HF_API_KEY = process.env.HF_API_KEY;
const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

async function generateJobTitles(industry, department, type) {
  const prompt = `Generate exactly 5 ${type} titles for the following:
Industry: ${industry}
Department: ${department}

Return ONLY a JSON array of 5 ${type} titles, nothing else. No explanations, no markdown, just the array.
Format: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`;

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      { 
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates ${type} titles. Always respond with valid JSON arrays only.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.choices[0].message.content.trim();
    
    // Parse the JSON array
    const jobTitles = JSON.parse(generatedText);
    
    return jobTitles;
    
  } catch (error) {
    console.error("❌ Error generating job titles:", error.response?.data || error.message);
  }
}

async function generateJobText(prompt) {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      { 
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates about the job. Always respond with paragraphs with bullet dots only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const generatedText = response.data.choices[0].message.content.trim();
    
    // Parse the JSON array
    // const jobTitles = JSON.parse(generatedText);
    const jobTitles = generatedText
    
    return jobTitles;
    
  } catch (error) {
    console.error("❌ Error generating job titles:", error.response?.data || error.message);
  }
}


async function generateInternAboutUs(prompt) {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      { 
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates about the intern bio. Always respond with paragraphs with bullet dots only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const generatedText = response.data.choices[0].message.content.trim();
    
    // Parse the JSON array
    // const jobTitles = JSON.parse(generatedText);
    const jobTitles = generatedText
    
    return jobTitles;
    
  } catch (error) {
    console.error("❌ Error generating job titles:", error.response?.data || error.message);
  }
}






async function generateSubCategory(industry) {
  const prompt = `Generate exactly 5 sub category for the following:
category: ${industry}

Return ONLY a JSON array of 5 sub category for ${industry}, nothing else. No explanations, no markdown, just the array.
Format: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`;

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      { 
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates sub category for the ${industry}. Always respond with valid JSON arrays only.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.choices[0].message.content.trim();
    
    // Parse the JSON array
    const jobTitles = JSON.parse(generatedText);
    
    return jobTitles;
    
  } catch (error) {
    console.error("❌ Error generating job titles:", error.response?.data || error.message);
  }
}

// generateJobTitles("software engineer", "back office");

module.exports = { generateJobTitles, generateJobText , generateInternAboutUs , generateSubCategory}