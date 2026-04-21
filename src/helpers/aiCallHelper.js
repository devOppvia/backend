require("dotenv").config();
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const prisma = require("../config/database");

const eleven = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const AUDIO_DIR = path.join(__dirname, "../../uploads/ai_call_audio");

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

async function generateAudio(text, fileName) {
  const filePath = path.join(AUDIO_DIR, `${fileName}.mp3`);
  if (fs.existsSync(filePath)) return `/uploads/ai_call_audio/${fileName}.mp3`;

  const audioStream = await eleven.textToSpeech.convert(VOICE_ID, {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });

  const chunks = [];
  for await (const chunk of audioStream) chunks.push(chunk);
  fs.writeFileSync(filePath, Buffer.concat(chunks));

  return `/uploads/ai_call_audio/${fileName}.mp3`;
}

async function prepareCallAudio(companyName, companyIntro, questions) {
  const introText =
    companyIntro ||
    `Hi, and thank you for your interest in ${companyName}. We’d love to learn more about your experience. I’ll ask you a few questions—please answer them as clearly as you can.`;
  const introUrl = await generateAudio(
    introText,
    `intro_${Buffer.from(companyName).toString("hex").slice(0, 12)}`,
  );

  const questionUrls = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const url = await generateAudio(q.question, `q_${q.id}`);
    questionUrls.push(url);
  }

  const closingUrl = await generateAudio(
    `Thank you for your time! We will review your responses and get back to you soon. Have a great day!`,
    `closing_global`,
  );

  return { introUrl, questionUrls, closingUrl };
}

// async function  correctCallAnswers(transcript) {
//   try {
//     const systemPrompt = `
// You are a STRICT speech-to-text correction engine.

// CRITICAL RULES (follow exactly):
// - Return ONLY valid JSON array
// - Keep EXACT same structure and order
// - DO NOT change "question"
// - DO NOT rephrase sentences
// - DO NOT add words
// - DO NOT remove words
// - DO NOT change grammar
// - ONLY fix obvious spelling / recognition mistakes

// STRICT CORRECTION POLICY:
// - Change a word ONLY if you are at least 99% sure it is गलत (wrong)
// - If there is ANY doubt → DO NOT change it
// - If sentence meaning might change → DO NOT change it
// - If multiple interpretations possible → DO NOT change it

// EXAMPLES:
// Input: "I have two year experience in jaba script"
// Output: "I have two year experience in java script"

// Input: "I worked in node js backend"
// Output: "I worked in node js backend"  (NO CHANGE)

// Input: "I have experience in react and redux"
// Output: "I have experience in react and redux" (NO CHANGE)

// FINAL RULE:
// Default behavior = DO NOTHING

// Output format:
// [
//   {
//     "answer": "corrected answer",
//     "question": "...",
//     "confidence": "...",
//     "questionIndex": 0
//   }
// ]
// `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         { role: "system", content: systemPrompt },
//         {
//           role: "user",
//           content: JSON.stringify(transcript),
//         },
//       ],
//     });

//     const raw = response.choices[0].message.content
//       .replace(/```json\n?/g, "")
//       .replace(/```\n?/g, "")
//       .trim();

//     return JSON.parse(raw);
//   } catch (error) {
//     console.error("Correction error:", error);
//     return transcript; // fallback
//   }
// }

// async function scoreCallAnswers(companyName, jobTitle, qaTranscript) {
//   const transcriptText = qaTranscript
//     .map(
//       (t, i) =>
//         `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer || "(no answer)"}`,
//     )
//     .join("\n\n");

//   const systemPrompt = `You are a professional HR evaluator assessing a phone interview for a ${jobTitle} internship at ${companyName}.
// Evaluate the candidate's answers for clarity, relevance, confidence, and communication skills.
// Return ONLY valid JSON in this format:
// {
//   "callScore": <number 0-10, one decimal>,
//   "callSummary": "<2-3 sentence summary of performance>"
// }`;

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: `Interview transcript:\n\n${transcriptText}` },
//     ],
//     temperature: 0.3,
//     max_tokens: 300,
//   });

//   const raw = response.choices[0].message.content
//     .replace(/```json\n?/g, "")
//     .replace(/```\n?/g, "")
//     .trim();

//   const parsed = JSON.parse(raw);
//   return {
//     callScore: Math.min(Math.max(parseFloat(parsed.callScore) || 0, 0), 10),
//     callSummary: parsed.callSummary || "",
//   };
// }



async function correctCallAnswers(transcript) {
  try {
    // ✅ split transcript
    const toCorrect = [];
    const untouched = [];

    for (const item of transcript) {
      const conf = parseFloat(item.confidence || "0");

      if (conf > 0.6) {
        toCorrect.push(item); // send to AI
      } else {
        untouched.push(item); // keep as-is
      }
    }

    let corrected = [];

    // ✅ only call AI if needed
    if (toCorrect.length > 0) {
      const systemPrompt = `
You are a STRICT speech-to-text correction engine.

CRITICAL RULES (follow exactly):
- Return ONLY valid JSON array
- Keep EXACT same structure and order
- DO NOT change "question"
- DO NOT rephrase sentences
- DO NOT add words
- DO NOT remove words
- DO NOT change grammar
- ONLY fix obvious spelling / recognition mistakes

STRICT CORRECTION POLICY:
- Change a word ONLY if you are at least 99% sure it is wrong
- If there is ANY doubt → DO NOT change it

FINAL RULE:
Default behavior = DO NOTHING
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(toCorrect),
          },
        ],
      });

      const raw = response.choices[0].message.content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      corrected = JSON.parse(raw);
    }

    // ✅ merge back in original order
    const correctedMap = new Map(
      corrected.map((item) => [item.questionIndex, item]),
    );

    const finalResult = transcript.map((item) => {
      const conf = parseFloat(item.confidence || "0");

      if (conf > 0.6 && correctedMap.has(item.questionIndex)) {
        return correctedMap.get(item.questionIndex);
      }

      return item; // unchanged
    });

    return finalResult;
  } catch (error) {
    console.error("Correction error:", error);
    return transcript;
  }
}






async function scoreCallAnswers(companyName, jobTitle, qaTranscript) {
  const transcriptText = qaTranscript
    .map(
      (t, i) =>
        `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer || "(no answer)"}`,
    )
    .join("\n\n");

  const systemPrompt = `You are a professional HR evaluator assessing a phone interview for a ${jobTitle} internship at ${companyName}.
Evaluate the candidate's answers for clarity, relevance, confidence, and communication skills.
Return ONLY valid JSON in this format:
{
  "callScore": <number 0-10, one decimal>,
  "callSummary": "<2-3 sentence summary of performance>"
}`;

  
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // 🔥 SWITCH MODEL (important)
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Interview transcript:\n\n${transcriptText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    },
  );

  const data = await response.json();

  console.log("response ==> ", data);

  const raw = data.choices[0].message.content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(raw);
  return {
    callScore: Math.min(Math.max(parseFloat(parsed.callScore) || 0, 0), 10),
    callSummary: parsed.callSummary || "",
  };
}


async function isRepeatRequest(spokenText, question) {
  if (!spokenText || spokenText.trim().length === 0) return false;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // fast + cheap, perfect for this
    max_tokens: 5,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are classifying a voice response in a phone interview. " +
          "Reply with exactly one word: REPEAT or ANSWER. " +
          "Reply REPEAT if the person is asking to hear the question again " +
          "(e.g. 'repeat', 'say again', 'what?', 'huh?', 'sorry?', 'I didn't hear', 'pardon', 'could you repeat'). " +
          "Reply ANSWER if the person is actually answering the question, even if briefly." +
          "only return REPEAT or ANSWER",
      },
      {
        role: "user",
        content: `Interview question: "${question}"\nCandidate said: "${spokenText}"\nClassify:`,
      },
    ],
  });

  const verdict = response.choices[0]?.message?.content?.trim().toUpperCase();
  console.log("verdict ==> ", response.choices[0]?.message?.content);
  console.log("verdict ==> ", verdict);
  return verdict === "REPEAT";
}



module.exports = {
  generateAudio,
  prepareCallAudio,
  scoreCallAnswers,
  correctCallAnswers,
  isRepeatRequest,
};














