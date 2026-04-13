const CATEGORY_GUIDANCE = {
  BEHAVIORAL:
    "Use STAR-method questions about past experiences, teamwork, leadership, and conflict resolution. Ask 'Tell me about a time when...' style questions.",
  TECHNICAL:
    "Ask coding concepts, system internals, debugging scenarios, and technical problem-solving. Probe for depth and understanding beyond surface-level answers.",
  CASE_STUDY:
    "Present business scenarios, market entry problems, estimation questions, and strategy cases. Guide the candidate through structured problem-solving.",
  SYSTEM_DESIGN:
    "Ask about designing scalable systems — database schema, API design, microservices, load balancing, caching, and trade-offs. Start broad then drill into specifics.",
  CODING_DSA:
    "Focus on data structures (arrays, linked lists, trees, graphs, heaps) and algorithms (sorting, searching, dynamic programming, recursion). Ask about time and space complexity.",
  HR_CULTURE_FIT:
    "Ask about career goals, motivation, values alignment, preferred work style, and how the candidate handles feedback, ambiguity, or team conflict.",
  PROJECT_DEEP_DIVE:
    "Dig into the candidate's past projects from their resume. Ask about design decisions, challenges faced, what they would do differently, and the technical depth of their contributions.",
  RESUME_BASED:
    "Ask questions directly referencing the candidate's resume — explore their listed skills, work experience, gaps, achievements, and any technologies they have mentioned.",
  DEBUGGING:
    "Present broken or buggy system scenarios and ask the candidate to identify root causes and propose fixes. Focus on their systematic debugging approach.",
  MIXED:
    "Balance behavioral, technical, and situational questions for an all-round assessment. Vary question style each turn.",
};

exports.buildNextQuestionPrompt = (
  interview,
  conversationHistory,
  questionNumber,
  totalQuestions,
) => {
  const categoryGuidance =
    CATEGORY_GUIDANCE[interview.interviewCategory] ||
    "Ask relevant interview questions tailored to the candidate's background.";

  return {
    system: `You are a professional ${interview.interviewerPreference.toLowerCase()} interviewer
conducting a ${interview.interviewCategory} interview.
${interview.type === "COMPANY" ? `Company context: ${interview.jobDescription}` : ""}
${interview.additionalContext ? `Additional context: ${interview.additionalContext}` : ""}
Candidate resume: ${interview.resumeSnapshot}
This is question ${questionNumber} of ${totalQuestions}.

Interview category guidance: ${categoryGuidance}

IMPORTANT RULES:
- You MUST return ALL 3 fields: "question", "skillTested", "questionType"
- NEVER skip "questionType"
- NEVER return partial JSON
- NEVER return text outside JSON
- ALWAYS choose a valid "questionType" from the allowed list
- If unsure, PICK the closest match (DO NOT OMIT)

Allowed questionType values:
BEHAVIORAL
TECHNICAL
CASE_STUDY
SYSTEM_DESIGN
CODING_DSA
HR_CULTURE_FIT
PROJECT_DEEP_DIVE
RESUME_BASED
DEBUGGING
MIXED

STRICT OUTPUT FORMAT (FOLLOW EXACTLY):
{
  "question": "string",
  "skillTested": "string",
  "questionType": "ONE_OF_THE_ALLOWED_VALUES"
}
If you fail to include ANY field, the response is INVALID.


Build on weak points from previous answers. Keep questions concise and focused.`,

    user: `Conversation so far:
${conversationHistory}

Generate question ${questionNumber} in STRICT JSON format.`,
  };
};

exports.buildAnswerScoringPrompt = (
  questionText,
  answerText,
  interviewCategory,
) => {
  return {
    system: `You are evaluating an interview answer. Score it out of 10.
Interview type: ${interviewCategory}
Return ONLY valid JSON: 
{ 
  "score": 0-10, 
  "starUsed": true/false,
  "skillTested": "string",
  "feedback": "one concise sentence"
}`,

    user: `Question: ${questionText}\nAnswer: ${answerText}`,
  };
};

exports.buildInsightsPrompt = (
  interview,
  allQA,
  behaviorSummary,
  confidenceScore,
) => {
  const transcript = allQA
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.questionText}\nA: ${q.answerText}\nScore: ${q.answerScore}/10`,
    )
    .join("\n\n");

  return {
    system: `You are a career coach reviewing a completed interview.
Give exactly 3 performance insights. The third insight MUST address body language and confidence.
Return ONLY valid JSON: { "insights": ["...", "...", "..."] }`,

    user: `Interview transcript:\n${transcript}

Behavior data:
- Confidence score: ${confidenceScore}%
- Behavior breakdown: ${JSON.stringify(behaviorSummary)}`,
  };
};