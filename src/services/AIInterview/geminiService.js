const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY_TEXT_SCORE_GENERATOR,
});

// ─── Scoring Function ───────────────────────────────────────────────────────
async function scoreWithGemini({ question, answer, category, history }) {
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

Rules for scoring:
- 9-10: Exceptional answer with specific examples, clear structure, and deep insight
- 7-8: Good answer with relevant points but may lack depth or specific examples
- 5-6: Average answer, addresses the question but is vague or incomplete
- 3-4: Poor answer, missing key points or off-topic
- 1-2: Very poor, minimal effort or completely irrelevant

Be objective and consistent. Return ONLY the JSON object, no markdown formatting.`;

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

  const prompt = `
You are generating interview question ${questionNumber} of ${totalQuestions}.

Job Description: ${interview?.jobDescription || "Not provided"}
Resume: ${interview?.resumeSnapshot || "Not provided"}
Interview Category: ${category}
Previous Questions Asked:
${previousQuestions}

${forcedType ? `FOR THIS QUESTION: Generate a ${forcedType} type question.` : ""}

Generate a ${category.toLowerCase()} interview question that:
- Tests different skills than previous questions
- Is appropriate for the candidate's experience level
- Follows logically from previous answers if relevant
- Is clear, specific, and professional
- Takes 2-3 minutes to answer adequately

Return ONLY a JSON object with this exact structure:
{
  "question": "The question text - be specific and clear",
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
      max_tokens: 500,
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

  const prompt = `
You are a professional interviewer creating the opening question for an interview.

Job Description: ${interview?.jobDescription || "Not provided"}
Resume: ${interview?.resumeSnapshot || "Not provided"}
Interview Category: ${category}
This is question 1 of ${totalQuestions}.

Generate a strong opening ${firstType} question that:
- Makes a positive first impression
- Is relevant to the candidate's background
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
      max_tokens: 500,
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
  
  const prompt = `
You are generating ALL ${totalQuestions} interview questions for a ${category} interview.

Job Description: ${interview?.jobDescription || "Not provided"}
Resume: ${interview?.resumeSnapshot || "Not provided"}
Interview Category: ${category}
Duration: ${interview?.duration || 15} minutes

Generate ${totalQuestions} interview questions that:
1. Cover different skills and topics
2. Progress from general to specific
3. Are appropriate for the candidate's experience level
4. Take 1-2 minutes each to answer
5. Test a variety of: technical skills, behavioral traits, situational judgment, culture fit

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

module.exports = {
  scoreWithGemini,
  generateNextQuestionWithGemini,
  generateInsightsWithGemini,
  generateFirstQuestion,
  generateAllQuestions,
};
