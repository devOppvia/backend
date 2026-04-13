const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "pdf");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Generate PDF report for a completed AI interview.
 * @param {object} interview - AIInterview record with all fields
 * @param {object} intern - Interns record { fullName }
 * @param {Array}  questions - AIInterviewQuestion records
 * @param {Array}  expressions - AIInterviewExpression records
 * @returns {Promise<string>} Local file URL path
 */
exports.generateInterviewPDF = (interview, intern, questions, expressions) => {
  return new Promise((resolve, reject) => {
    try {
      ensureUploadDir();

      const fileName = `interview_${interview.id}_${Date.now()}.pdf`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const fileUrl = `/uploads/pdf/${fileName}`;

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const colors = { primary: "#1a1a2e", accent: "#e94560", light: "#555" };

      // ── Header ────────────────────────────────────────────────────────────
      doc.fontSize(20).fillColor(colors.primary).text("OPPVIA  |  AI Interview Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(colors.light)
        .text(`Candidate: ${intern.fullName}`, { align: "center" })
        .text(`Date: ${interview.completedAt?.toDateString() || "N/A"}  |  Type: ${interview.type}`, { align: "center" });

      doc.moveDown().moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(colors.accent).stroke();
      doc.moveDown();

      // ── Overall Performance ───────────────────────────────────────────────
      sectionTitle(doc, "OVERALL PERFORMANCE", colors);
      keyValue(doc, "Overall Score", `${interview.overallScore?.toFixed(1) ?? "N/A"} / 100`);
      keyValue(doc, "Avg Answer Score", `${interview.avgAnswerScore?.toFixed(1) ?? "N/A"} / 100`);
      keyValue(doc, "Total Questions", interview.totalQuestions ?? "N/A");
      keyValue(doc, "STAR Used", `${interview.starUsed ?? 0} / ${interview.totalQuestions ?? 0}`);
      keyValue(doc, "Top Skill", interview.topSkill ?? "N/A");
      keyValue(doc, "Duration", `${interview.durationActual ?? "N/A"} mins`);
      doc.moveDown();

      // ── Confidence & Behavior ─────────────────────────────────────────────
      sectionTitle(doc, "CONFIDENCE & BEHAVIOR", colors);
      keyValue(doc, "Confidence Score", `${interview.confidenceScore?.toFixed(1) ?? "N/A"}%`);
      keyValue(doc, "Dominant Emotion", interview.dominantEmotion ?? "N/A");
      const beh = interview.behaviorSummary || {};
      keyValue(doc, "Breakdown",
        `Confident ${beh.confident ?? 0}%  |  Nervous ${beh.nervous ?? 0}%  |  Neutral ${beh.neutral ?? 0}%  |  Happy ${beh.happy ?? 0}%  |  Confused ${beh.confused ?? 0}%`
      );
      doc.moveDown();

      // ── AI Insights ───────────────────────────────────────────────────────
      sectionTitle(doc, "AI PERFORMANCE INSIGHTS", colors);
      const insights = interview.aiInsights || [];
      insights.forEach((insight, i) => {
        doc.fontSize(10).fillColor(colors.light).text(`${i + 1}. ${insight}`, { indent: 10 });
        doc.moveDown(0.3);
      });
      doc.moveDown();

      // ── Q&A Breakdown ─────────────────────────────────────────────────────
      sectionTitle(doc, "QUESTION-BY-QUESTION BREAKDOWN", colors);
      questions.forEach((q) => {
        doc.fontSize(10).fillColor(colors.primary).text(`Q${q.questionNumber}: ${q.questionText}`, { bold: true });
        doc.fontSize(9).fillColor(colors.light)
          .text(`Answer: ${q.answerText || "No answer provided"}`, { indent: 10 })
          .text(`Score: ${q.answerScore ?? "N/A"}/10  |  Skill: ${q.skillTested || "N/A"}  |  STAR: ${q.starUsed ? "Yes" : "No"}`, { indent: 10 })
          .text(`Feedback: ${q.aiFeedback || "N/A"}`, { indent: 10 });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
        doc.moveDown(0.5);
      });

      // ── Expression Timeline ───────────────────────────────────────────────
      if (expressions.length > 0) {
        doc.addPage();
        sectionTitle(doc, "EXPRESSION TIMELINE", colors);
        doc.fontSize(9).fillColor(colors.primary)
          .text("Time              Emotion              Confidence", { underline: true });
        doc.moveDown(0.3);

        expressions.forEach((e) => {
          const t = new Date(e.timestamp);
          const mins = String(t.getMinutes()).padStart(2, "0");
          const secs = String(t.getSeconds()).padStart(2, "0");
          const timeStr = `00:${mins}:${secs}`;
          doc.fontSize(9).fillColor(colors.light)
            .text(`${timeStr.padEnd(18)}${e.emotion.padEnd(21)}${e.confidenceScore?.toFixed(1) ?? "N/A"}%`);
        });
      }

      doc.end();

      stream.on("finish", () => resolve(fileUrl));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

function sectionTitle(doc, text, colors) {
  doc.fontSize(13).fillColor(colors.accent).text(text);
  doc.moveDown(0.4);
}

function keyValue(doc, key, value) {
  doc.fontSize(10).fillColor("#222").text(`${key}: `, { continued: true }).fillColor("#555").text(String(value));
}
