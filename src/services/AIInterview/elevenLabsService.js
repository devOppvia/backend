const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

const AUDIO_DIR = path.join(process.cwd(), "uploads", "ai_interview_audio");

// Ensure audio cache directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const getCachePath = (interviewId, questionNumber) =>
  path.join(AUDIO_DIR, `${interviewId}_q${questionNumber}.mp3`);

// ─── Text to Speech ───────────────────────────────────────────────────────────
// Always generates fresh audio from ElevenLabs (guarantees the spoken text
// matches what's displayed, even if the same questionNumber was asked before
// with different AI-generated text). Simultaneously writes to disk so that
// the replay endpoint can serve it instantly without a second API call.
async function textToSpeech({ text, interviewId, questionNumber, res }) {
  const cachePath = getCachePath(interviewId, questionNumber);

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-cache");

  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: "eleven_turbo_v2_5",
    output_format: "mp3_44100_128",
  });

  // Overwrite any stale cache file for this question number
  const fileStream = fs.createWriteStream(cachePath);

  // Pipe each chunk to response and to file simultaneously
  for await (const chunk of audioStream) {
    res.write(chunk);
    fileStream.write(chunk);
  }

  fileStream.end();
  res.end();
}

// ─── Serve Cached Audio (replay) ─────────────────────────────────────────────
// Returns false if cache miss so the controller can regenerate.
function serveCachedAudio({ interviewId, questionNumber, res }) {
  const cachePath = getCachePath(interviewId, questionNumber);

  if (!fs.existsSync(cachePath)) return false;

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=3600");
  fs.createReadStream(cachePath).pipe(res);
  return true;
}

// ─── Speech to Text ───────────────────────────────────────────────────────────
// Uses ElevenLabs Scribe v1 via direct HTTP (axios + form-data) to avoid
// SDK stream-handling issues with Buffer inputs in Node.js.
async function speechToText({ audioBuffer, mimeType }) {
  // Strip codec suffix — ElevenLabs only accepts the base MIME type
  const baseType = (mimeType || "audio/webm").split(";")[0].trim();
  const ext = baseType.includes("mp3") ? "mp3"
    : baseType.includes("wav") ? "wav"
    : baseType.includes("mp4") || baseType.includes("m4a") ? "mp4"
    : "webm";

  const form = new FormData();
  form.append("file", audioBuffer, {
    filename: `audio.${ext}`,
    contentType: baseType,
  });
  form.append("model_id", "scribe_v1");

  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/speech-to-text",
      form,
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          ...form.getHeaders(),
        },
      },
    );

    return {
      transcript: response.data.text || "",
      language: response.data.language_code || "en",
    };
  } catch (err) {
    console.error("ElevenLabs STT 400 body:", err.response?.data);
    throw err;
  }
}

// ─── Delete cached audio for an interview (cleanup) ──────────────────────────
function clearInterviewAudioCache(interviewId) {
  try {
    const files = fs.readdirSync(AUDIO_DIR).filter((f) =>
      f.startsWith(`${interviewId}_q`)
    );
    files.forEach((f) => fs.unlinkSync(path.join(AUDIO_DIR, f)));
  } catch {
    // Non-critical — ignore errors
  }
}

module.exports = { textToSpeech, serveCachedAudio, speechToText, clearInterviewAudioCache };
