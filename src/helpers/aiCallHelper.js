require("dotenv").config();

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_CHAT_MODEL = process.env.XAI_CHAT_MODEL || "grok-3-mini-fast";

const API_KEY = process.env.OPENAI_KEY_TEXT_SCORE_GENERATOR;

// ─── Score call answers using X AI Chat Completions ───────────────────────
// Now receives raw conversation text (from X AI Realtime transcript)
// instead of structured QA array — no more correction needed
async function scoreCallAnswers(companyName, jobTitle, conversationText) {
  const systemPrompt = `You are a professional HR evaluator assessing a phone interview for a ${jobTitle} position at ${companyName}.
Evaluate the candidate's answers for clarity, relevance, confidence, and communication skills.
Return ONLY valid JSON in this format:
{
  "callScore": <number 0-10, one decimal>,
  "callSummary": "<2-3 sentence summary of performance>"
}`;

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
         content: systemPrompt,
       },
     ],
     temperature: 0.3,
     max_tokens: 500,
   }),
 });

  const data = await response.json();
  console.log("response ==> ", data);

  // Handle API errors gracefully
   if (!response.statusText === "OK") {
     console.error("❌ OpenAI API Error:", data);
     throw new Error(data?.error?.message || "OpenAI API error");
   }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("❌ Invalid response from X AI:", data);
    return { callScore: null, callSummary: "Scoring unavailable" };
  }

  const raw = data.choices[0].message.content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(raw);
  return {
    callScore: Math.min(Math.max(parseFloat(parsed.callScore) || 0, 0), 10),
    callSummary: parsed.callSummary || "",
  };

  // ─── OpenRouter (commented out) ──────────────────────────────────────────
  // const response = await fetch(
  //   "https://openrouter.ai/api/v1/chat/completions",
  //   {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       model: "openai/gpt-4o-mini",
  //       messages: [
  //         { role: "system", content: systemPrompt },
  //         { role: "user", content: `Interview transcript:\n\n${transcriptText}` },
  //       ],
  //       temperature: 0.3,
  //       max_tokens: 500,
  //     }),
  //   },
  // );
}

module.exports = {
  scoreCallAnswers,
};

// ─── Old functions (commented out — no longer needed with X AI Realtime) ────
// X AI Realtime handles: intro, questions, repeat detection, TTS, STT
// No more pre-recorded audio, no more correction, no more repeat classification

// async function generateAudio(text, fileName) { ... }
// async function prepareCallAudio(companyName, companyIntro, questions) { ... }
// async function correctCallAnswers(transcript) { ... }
// async function isRepeatRequest(spokenText, question) { ... }














