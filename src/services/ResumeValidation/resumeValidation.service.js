require("dotenv").config();

const OPENAI_API_KEY =
  process.env.OPENAI_KEY_TEXT_SCORE_GENERATOR || process.env.OPENAI_KEY;

function extractJson(text) {
  if (!text) throw new Error("Empty AI response");

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON response from AI");
    return JSON.parse(match[0]);
  }
}

function normalizeResult(result) {
  return {
    isValid: Boolean(result.isValid),
    confidence: Math.min(Math.max(Number(result.confidence) || 0, 0), 100),
    reason:
      typeof result.reason === "string"
        ? result.reason
        : "Resume validation completed.",
    detectedSections: Array.isArray(result.detectedSections)
      ? result.detectedSections.filter((section) => typeof section === "string")
      : [],
    issues: Array.isArray(result.issues)
      ? result.issues.filter((issue) => typeof issue === "string")
      : [],
  };
}

async function validateResumeText(resumeText) {
  const cleanedResumeText = String(resumeText || "").trim();

  if (cleanedResumeText.length < 80) {
    return {
      isValid: false,
      confidence: 95,
      reason: "Text is too short to be a valid resume.",
      detectedSections: [],
      issues: ["Provide complete resume text, not a short phrase."],
    };
  }

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content:
            "You validate whether submitted text is a real resume/CV. Return only JSON with keys: isValid boolean, confidence number 0-100, reason string, detectedSections array of strings, issues array of strings. A valid resume usually includes a person's professional/education profile, skills, experience/projects/internships, education, or contact/profile details. Reject job descriptions, random text, cover letters only, spam, and very incomplete fragments.",
        },
        {
          role: "user",
          content: `Validate this resume text:\n\n${cleanedResumeText.slice(0, 12000)}`,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI API error");
  }

  const content = data?.choices?.[0]?.message?.content;
  return normalizeResult(extractJson(content));
}

module.exports = {
  validateResumeText,
};
