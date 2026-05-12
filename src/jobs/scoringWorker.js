const { Worker, Queue } = require("bullmq");
const IORedis = require("ioredis");
const OpenAI = require("openai");
const prisma = require("../config/database");

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  { maxRetriesPerRequest: null },
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const scoringQueue = new Queue("ai-call-scoring", { connection });

function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function scoreAnswer(questionText, answerText) {
  const prompt = `You are evaluating a phone interview answer.

Question:
${questionText}

Candidate Answer:
${answerText}

Evaluate on:
- Technical accuracy
- Communication clarity
- Confidence

Return ONLY valid JSON in this format:
{"score": <number 1-10>, "summary": "<one sentence evaluation>"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 200,
  });

  const text = response.choices[0]?.message?.content?.trim() || "";
  const parsed = parseJsonResponse(text);

  return {
    score: Number(parsed.score),
    summary: String(parsed.summary || ""),
  };
}

async function buildCallSummary(conversationText) {
  if (!conversationText) return null;

  const summaryResp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Summarize this phone interview in 2-3 sentences. Focus on the candidate's overall performance.\n\n${conversationText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 150,
  });

  return summaryResp.choices[0]?.message?.content?.trim() || null;
}

const worker = new Worker(
  "ai-call-scoring",
  async (job) => {
    const { callId, attemptId, durationSec, conversationText } = job.data;
    console.log(`🔧 [Scoring Worker] Processing job for callId=${callId}`);

    const aiCall = await prisma.aICall.findUnique({
      where: { id: callId },
      include: {
        answers: {
          include: { question: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!aiCall) {
      console.error(`❌ [Scoring Worker] AICall ${callId} not found`);
      return;
    }

    let totalScore = 0;
    let scoredCount = 0;

    for (const answer of aiCall.answers) {
      if (!answer.question) continue;

      try {
        const { score, summary } = await scoreAnswer(
          answer.question.question,
          answer.answer,
        );

        if (!Number.isFinite(score)) {
          throw new Error("Score response was not a number");
        }

        await prisma.aICallAnswer.update({
          where: { id: answer.id },
          data: { score, summary },
        });

        totalScore += score;
        scoredCount += 1;
        console.log(
          `✅ [Scoring Worker] Q scored: score=${score} — "${answer.question.question.slice(0, 40)}"`,
        );
      } catch (err) {
        console.error(
          `❌ [Scoring Worker] Failed to score answer ${answer.id}:`,
          err.message,
        );
      }
    }

    const overallScore = scoredCount > 0 ? totalScore / scoredCount : null;

    let callSummary = null;
    if (scoredCount > 0) {
      try {
        callSummary = await buildCallSummary(conversationText);
      } catch (err) {
        console.error(
          "❌ [Scoring Worker] Summary generation failed:",
          err.message,
        );
      }
    }

    await prisma.aICallAttempt.update({
      where: { id: attemptId },
      data: { status: "ANSWERED_COMPLETED", duration: durationSec },
    });

    await prisma.aICall.update({
      where: { id: callId },
      data: {
        status: "COMPLETED",
        callScore: overallScore,
        callSummary,
        transcript: conversationText,
      },
    });

    if (overallScore !== null) {
      await prisma.candidateManagement.update({
        where: { id: aiCall.candidateManagementId },
        data: {
          score: Math.round(overallScore),
          scoredReason: callSummary,
        },
      });
    }

    console.log(
      `✅ [Scoring Worker] Call ${callId} completed — overallScore=${overallScore}`,
    );
  },
  { connection, concurrency: 3 },
);

worker.on("failed", (job, err) => {
  console.error(`❌ [Scoring Worker] Job ${job?.id} failed:`, err.message);
});

module.exports = { scoringQueue };
