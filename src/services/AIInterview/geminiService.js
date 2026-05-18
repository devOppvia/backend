const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY_TEXT_SCORE_GENERATOR,
});

// ─── Scoring Function ───────────────────────────────────────────────────────
async function  scoreWithGemini({ question, answer, category, history }) {
  const historyText = history?.length
    ? history.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n\n")
    : "None";

  const prompt = `
You are an expert technical interviewer evaluating a candidate's answer.

Question: "${question}"
Answer: "${answer}"
Interview Type: ${category}
Previous Context: ${historyText}

Evaluate and return ONLY a JSON object with this exact structure:
{
  "score": 0-10 (numerical score where 10 is excellent),
  "feedback": "2-3 sentence constructive feedback",
  "starUsed": true/false (was STAR method used in the answer?),
  "skillTested": "primary skill being tested"
}

Scoring Guidelines:
- 9-10 → Excellent answer: highly clear, confident, structured, specific examples, strong technical depth, demonstrates senior-level thinking
- 7-8 → Good answer: correct, relevant, well explained, shows solid understanding even if some details are missing
- 5-6 → Average answer: partially correct, somewhat vague, lacks clarity/examples/depth
- 3-4 → Weak answer: important gaps, confusion, weak explanation, partially off-topic
- 0-2 → Very poor answer: incorrect, irrelevant, or minimal effort

Important Evaluation Rules:
- Do NOT score too harshly.
- Reward clarity, confidence, communication, and logical thinking.
- Minor missing details should NOT heavily reduce score.
- If the answer is strong overall, prefer 7-8 instead of 5-6.
- Use the full scoring range naturally.
- Only give 9-10 for truly outstanding answers.
- Consider communication quality alongside technical accuracy.

STAR Method Detection:
- starUsed should be true if the answer includes Situation, Task, Action, or Result structure even partially.

Return ONLY raw JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);
    
    // Validate and normalize
    return {
      score: Math.max(0, Math.min(10, parseFloat(parsed.score) || 5)),
      feedback: parsed.feedback || "No feedback provided",
      starUsed: Boolean(parsed.starUsed),
      skillTested: parsed.skillTested || category,
    };
  } catch (err) {
    console.error("OpenAI scoring error:", err);
    // Return fallback
    return {
      score: 5,
      feedback: "Unable to generate detailed feedback at this time.",
      starUsed: false,
      skillTested: category,
    };
  }
}

// ─── Question Generation Function ────────────────────────────────────────────
async function generateNextQuestionWithGemini({ interview, history, questionNumber, totalQuestions }) {
  const previousQuestions = history?.length
    ? history.map((h, i) => `${i + 1}. ${h.question}`).join("\n")
    : "None";

  const category = interview?.interviewCategory || "MIXED";
  const rotation = getQuestionRotation(totalQuestions);
  const forcedType = rotation?.[questionNumber - 1];

  const websiteText = interview?.companyWebsiteText || "";
  const additionalContext = interview?.additionalContext || "";
  const contextParts = [];
  if (interview?.jobDescription) contextParts.push(`Job Description:\n${interview.jobDescription}`);
  if (websiteText) contextParts.push(`Company Website Content:\n${websiteText}`);
  if (additionalContext) contextParts.push(`Additional Context:\n${additionalContext}`);
  const contextSection = contextParts.length ? contextParts.join("\n\n") : `Practice Focus: ${category}`;

  const prompt = `
You are generating interview question ${questionNumber} of ${totalQuestions}.

Resume: ${interview?.resumeSnapshot || "Not provided"}
Interview Category: ${category}

${contextSection}

Previous Questions Asked:
${previousQuestions}

${forcedType ? `FOR THIS QUESTION: Generate a ${forcedType} type question.` : ""}

Generate a ${category.toLowerCase()} interview question that:
- Is grounded in the job description, company context, or candidate's resume above — do NOT ask generic questions
- Tests different skills than previous questions
- Is appropriate for the candidate's experience level
- Is concise — ONE sentence or TWO short sentences maximum, 20 words or fewer
- Is direct and conversational, as if asked face-to-face

Return ONLY a JSON object with this exact structure:
{
  "question": "The question text — short and direct",
  "questionType": "${forcedType || "BEHAVIORAL|TECHNICAL|SITUATIONAL|CLOSING"}",
  "skillTested": "specific skill being assessed (e.g., Leadership, Problem Solving, React, Communication)"
}

Return ONLY the JSON object, no markdown formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);
    
    // Validate and normalize
    return {
      question: parsed.question || "Tell me about your relevant experience for this role.",
      questionType: forcedType || parsed.questionType || category,
      skillTested: parsed.skillTested || category,
    };
  } catch (err) {
    console.error("OpenAI question generation error:", err);
    // Return fallback
    return {
      question: "Tell me about a challenging situation you faced and how you handled it.",
      questionType: forcedType || "BEHAVIORAL",
      skillTested: "Problem Solving",
    };
  }
}

// ─── Insights Generation Function ────────────────────────────────────────────
async function generateInsightsWithGemini({ interview, questions, behaviorSummary }) {
  const questionsAndScores = questions?.length
    ? questions.map((q) => `Q: ${q.questionText}\nScore: ${q.answerScore || 0}/10`).join("\n\n")
    : "No questions answered";

  const overallScore = interview?.overallScore || 0;

  const prompt = `
Analyze this interview and provide 3-5 personalized, actionable insights.

Questions & Scores:
${questionsAndScores}

Behavior Summary:
- Confident: ${behaviorSummary?.confident || 0}%
- Nervous: ${behaviorSummary?.nervous || 0}%
- Neutral: ${behaviorSummary?.neutral || 0}%

Overall Score: ${overallScore}/100

Provide insights that are:
1. Specific to the candidate's performance
2. Actionable for future improvement
3. Balanced (highlight strengths and areas for improvement)
4. Professional and encouraging in tone

Return ONLY a JSON object with this exact structure:
{
  "insights": [
    "insight 1 - focus on a specific strength or pattern observed",
    "insight 2 - constructive feedback on an area for improvement",
    "insight 3 - recommendation for future interviews or skill development"
  ]
}

Return ONLY the JSON object, no markdown formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a career coach reviewing interview performance. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);
    
    // Validate and normalize
    return {
      insights: parsed.insights?.slice(0, 5) || [
        "Continue practicing structured responses using the STAR method.",
        "Maintain good eye contact and confident body language throughout the interview.",
        "Prepare specific examples from your experience for common interview questions.",
      ],
    };
  } catch (err) {
    console.error("OpenAI insights generation error:", err);
    // Return fallback
    return {
      insights: [
        "Consider using the STAR method (Situation, Task, Action, Result) for more structured answers.",
        "Practice maintaining consistent confidence throughout the entire interview.",
        "Prepare specific examples from your past experience to support your answers.",
      ],
    };
  }
}

// ─── Helper: Question Rotation for MIXED interviews ──────────────────────────
function getQuestionRotation(totalQuestions) {
  const rotations = {
    8: ["RESUME_BASED", "BEHAVIORAL", "HR_CULTURE_FIT", "TECHNICAL", "BEHAVIORAL", "PROJECT_DEEP_DIVE", "CASE_STUDY", "HR_CULTURE_FIT"],
    12: ["RESUME_BASED", "BEHAVIORAL", "HR_CULTURE_FIT", "TECHNICAL", "BEHAVIORAL", "PROJECT_DEEP_DIVE", "CASE_STUDY", "CODING_DSA", "BEHAVIORAL", "SYSTEM_DESIGN", "DEBUGGING", "HR_CULTURE_FIT"],
    15: ["RESUME_BASED", "BEHAVIORAL", "HR_CULTURE_FIT", "TECHNICAL", "BEHAVIORAL", "PROJECT_DEEP_DIVE", "CASE_STUDY", "CODING_DSA", "BEHAVIORAL", "SYSTEM_DESIGN", "DEBUGGING", "HR_CULTURE_FIT", "RESUME_BASED", "TECHNICAL", "HR_CULTURE_FIT"],
    20: ["RESUME_BASED", "BEHAVIORAL", "HR_CULTURE_FIT", "TECHNICAL", "BEHAVIORAL", "PROJECT_DEEP_DIVE", "CASE_STUDY", "CODING_DSA", "BEHAVIORAL", "SYSTEM_DESIGN", "DEBUGGING", "HR_CULTURE_FIT", "RESUME_BASED", "TECHNICAL", "BEHAVIORAL", "PROJECT_DEEP_DIVE", "CASE_STUDY", "SYSTEM_DESIGN", "CODING_DSA", "HR_CULTURE_FIT"],
  };
  return rotations[totalQuestions];
}

// ─── First Question Generation (using GPT-4o style) ───────────────────────────
async function generateFirstQuestion(interview, totalQuestions) {
  const category = interview?.interviewCategory || "MIXED";
  const rotation = getQuestionRotation(totalQuestions);
  const firstType = rotation?.[0] || "RESUME_BASED";
  const websiteText = interview?.companyWebsiteText || "";
  const additionalContext = interview?.additionalContext || "";

  const contextParts = [];
  if (interview?.jobDescription) contextParts.push(`Job Description:\n${interview.jobDescription}`);
  if (websiteText) contextParts.push(`Company Website Content:\n${websiteText}`);
  if (additionalContext) contextParts.push(`Additional Context:\n${additionalContext}`);
  const contextSection = contextParts.length ? contextParts.join("\n\n") : `Practice Focus: ${category}`;

  const prompt = `
You are a professional interviewer creating the opening question for an interview.

Resume: ${interview?.resumeSnapshot || "Not provided"}
Interview Category: ${category}
This is question 1 of ${totalQuestions}.

${contextSection}

Generate a strong opening ${firstType} question that:
- Is grounded in the job description, company context, or candidate's resume above
- Makes a positive first impression
- Sets the tone for a professional interview
- Is engaging but not overly complex

Return ONLY a JSON object with this exact structure:
{
  "question": "The question text",
  "questionType": "${firstType}",
  "skillTested": "specific skill"
}

Return ONLY the JSON object, no markdown formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);
    
    return {
      question: parsed.question || "Tell me about yourself and your background.",
      questionType: firstType,
      skillTested: parsed.skillTested || "Self Presentation",
    };
  } catch (err) {
    console.error("OpenAI first question error:", err);
    return {
      question: "Tell me about yourself and your relevant experience for this position.",
      questionType: firstType,
      skillTested: "Self Presentation",
    };
  }
}

// ─── Generate ALL Questions at Once ───────────────────────────────────────────
async function generateAllQuestions({ interview, totalQuestions }) {
  const category = interview?.interviewCategory || "MIXED";
  const questions = [];
  
  const websiteText = interview?.companyWebsiteText || "";
  const additionalContext = interview?.additionalContext || "";
  const contextParts = [];
  if (interview?.jobDescription) contextParts.push(`Job Description:\n${interview.jobDescription}`);
  if (websiteText) contextParts.push(`Company Website Content:\n${websiteText}`);
  if (additionalContext) contextParts.push(`Additional Context:\n${additionalContext}`);
  const contextSection = contextParts.length ? contextParts.join("\n\n") : `Practice Focus: ${category}`;

  const prompt = `
You are generating ALL ${totalQuestions} interview questions for a ${category} interview.

Resume: ${interview?.resumeSnapshot || "Not provided"}
Interview Category: ${category}
Duration: ${interview?.duration || 15} minutes

${contextSection}

Generate ${totalQuestions} interview questions that:
1. Are grounded in the job description, company context, and candidate resume above — reference specific skills, technologies, values, or experiences
2. Cover different skills and topics
3. Progress from general to specific
4. Are appropriate for the candidate's experience level
5. Take 1-2 minutes each to answer
6. Test a variety of: technical skills, behavioral traits, situational judgment, culture fit relevant to this role

Return ONLY a JSON array with ${totalQuestions} objects, each with this structure:
[
  {
    "question": "The question text",
    "questionType": "BEHAVIORAL|TECHNICAL|SITUATIONAL|CLOSING",
    "skillTested": "specific skill"
  },
  ...
]

Return ONLY the JSON array, no markdown formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Handle both array and {questions: [...]} formats
    const questionArray = Array.isArray(parsed) ? parsed : parsed.questions || [];
    
    // Validate and normalize
    return questionArray.slice(0, totalQuestions).map((q, i) => ({
      question: q.question || `Question ${i + 1}: Tell me about yourself.`,
      questionType: q.questionType || "BEHAVIORAL",
      skillTested: q.skillTested || "General",
    }));
  } catch (err) {
    console.error("OpenAI batch generation error:", err);
    // Return fallback questions
    return Array.from({ length: totalQuestions }, (_, i) => ({
      question: `Question ${i + 1}: Tell me about your relevant experience for this position.`,
      questionType: i === 0 ? "OPENING" : i === totalQuestions - 1 ? "CLOSING" : "BEHAVIORAL",
      skillTested: "Experience Assessment",
    }));
  }
}

// ─── Generate Question for Specific Type (V2 API) ────────────────────────────
async function generateQuestionForType({
  interview,
  questionNumber,
  totalQuestions,
  questionType,
  previousQuestions,
}) {
  const previousText = previousQuestions?.length
    ? previousQuestions.map((q, i) => `${i + 1}. [${q.questionType || 'UNKNOWN'}] ${q.question}`).join("\n")
    : "None";

  const category = interview?.interviewCategory || "MIXED";
  const jd = interview?.jobDescription || "Not provided";
  const websiteText = interview?.companyWebsiteText || "";
  const additionalContext = interview?.additionalContext || "";
  const resume = interview?.resumeSnapshot || "Not provided";

  const contextParts = [];
  if (jd && jd !== "Not provided") contextParts.push(`Job Description:\n${jd}`);
  if (websiteText) contextParts.push(`Company Website Content:\n${websiteText}`);
  if (additionalContext) contextParts.push(`Additional Context:\n${additionalContext}`);
  const contextSection = contextParts.length
    ? contextParts.join("\n\n")
    : interview?.type !== "COMPANY"
      ? `Practice Focus: ${category}`
      : "No additional context provided";

  const typeInstructions = {
    BEHAVIORAL: 'Start with "Tell me about a time..." or "Describe a situation where..." — draw from the resume or JD context if available.',
    TECHNICAL: "Ask about one specific concept, tool, technology, or approach mentioned in the JD or resume. Keep it focused.",
    SITUATIONAL: "Describe a realistic work scenario in one short sentence (tie it to the JD/company context if possible), then ask what they would do.",
    CLOSING: "Ask one simple closing question about their interest in this specific role/company or their availability.",
    HR_CULTURE_FIT: "Ask about values, work style, team dynamics, or motivation — tie it directly to the company culture from the website content or job description if available.",
    RESUME_BASED: "Ask specifically about a project, experience, skill, or achievement mentioned in the candidate's resume.",
    PROJECT_DEEP_DIVE: "Ask for a deep explanation of a specific project from the resume — their role, technical decisions made, or outcomes.",
    CASE_STUDY: "Present a short business or technical scenario relevant to the role (one sentence) and ask how they would approach it.",
    CODING_DSA: "Ask a concise data structures or algorithms question relevant to the technical stack in the JD.",
    SYSTEM_DESIGN: "Ask the candidate to design or architect a system or component relevant to the company's domain.",
    DEBUGGING: "Describe a short hypothetical bug scenario relevant to their tech stack and ask how they would debug it.",
  };

  const typeInstruction = typeInstructions[questionType] || `Generate a question appropriate for a ${questionType} interview.`;

  const prompt = `
You are an expert interviewer generating question ${questionNumber} of ${totalQuestions}.

=== INTERVIEW CONTEXT ===
Category: ${category}
Question Type: ${questionType}
Resume: ${resume}

${contextSection}

=== PREVIOUS QUESTIONS (do NOT repeat these) ===
${previousText}

=== YOUR TASK ===
Generate a SINGLE ${questionType} question. Important rules:
1. ${typeInstruction}
2. The question MUST be grounded in the context above — reference the job role, company, required skills, or candidate background. Do NOT ask a generic question.
3. Tests a different skill than all previous questions listed above.
4. Is concise — ONE sentence or TWO short sentences maximum, 20 words or fewer.
5. Is direct and conversational, as if asked face-to-face.

Return ONLY a JSON object:
{
  "question": "The question text — short, direct, and context-grounded",
  "skillTested": "Specific skill being assessed (e.g., Leadership, React, Communication, Culture Fit)"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);

    return {
      question: parsed.question || "Tell me about yourself.",
      questionType,
      skillTested: parsed.skillTested || questionType,
    };
  } catch (err) {
    console.error("Question generation error:", err);
    // Fallback questions by type
    const fallbacks = {
      BEHAVIORAL: "Tell me about a time you faced a challenging situation at work. How did you handle it?",
      TECHNICAL: "Explain a complex technical concept you're familiar with as if teaching a junior developer.",
      SITUATIONAL: "How would you handle a situation where you disagree with your team's technical approach?",
      CLOSING: "Do you have any questions about the role or our company?",
    };
    return {
      question: fallbacks[questionType] || fallbacks.BEHAVIORAL,
      questionType,
      skillTested: questionType,
    };
  }
}

module.exports = {
  scoreWithGemini,
  generateNextQuestionWithGemini,
  generateInsightsWithGemini,
  generateFirstQuestion,
  generateAllQuestions,
  generateQuestionForType,
};
