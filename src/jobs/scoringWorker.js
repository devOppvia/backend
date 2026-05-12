const OpenAI = require("openai");
const prisma = require("../config/database");

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const parsedConcurrency = Number(process.env.AI_CALL_SCORING_CONCURRENCY || 3);
const SCORING_CONCURRENCY = Number.isFinite(parsedConcurrency)
  ? parsedConcurrency
  : 3;

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

async function processScoringJob(job) {
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
}

class InMemoryScoringQueue {
  constructor({ concurrency, processor }) {
    this.active = 0;
    this.concurrency = Math.max(1, concurrency);
    this.jobs = [];
    this.jobId = 0;
    this.processor = processor;
  }

  async add(name, data, options = {}) {
    const job = {
      id: String(++this.jobId),
      name,
      data,
      attemptsMade: 0,
      options,
    };

    this.jobs.push(job);
    this.drain();
    return job;
  }

  drain() {
    while (this.active < this.concurrency && this.jobs.length > 0) {
      const job = this.jobs.shift();
      this.active += 1;
      this.run(job);
    }
  }

  async run(job) {
    try {
      job.attemptsMade += 1;
      await this.processor(job);
    } catch (err) {
      const maxAttempts = job.options.attempts || 1;

      if (job.attemptsMade < maxAttempts) {
        const delay = this.getBackoffDelay(job);
        console.error(
          `❌ [Scoring Worker] Job ${job.id} failed, retrying in ${delay}ms:`,
          err.message,
        );

        setTimeout(() => {
          this.jobs.push(job);
          this.drain();
        }, delay);
      } else {
        console.error(`❌ [Scoring Worker] Job ${job.id} failed:`, err.message);
      }
    } finally {
      this.active -= 1;
      this.drain();
    }
  }

  getBackoffDelay(job) {
    const backoff = job.options.backoff;
    if (!backoff) return 0;

    const baseDelay = Number(backoff.delay || 0);
    if (backoff.type === "exponential") {
      return baseDelay * 2 ** Math.max(0, job.attemptsMade - 1);
    }

    return baseDelay;
  }
}

const scoringQueue = new InMemoryScoringQueue({
  concurrency: SCORING_CONCURRENCY,
  processor: processScoringJob,
});

module.exports = { scoringQueue };
