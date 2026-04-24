const axios = require('axios');
const FormData = require('form-data');
const OpenAI = require('openai');
require('dotenv').config();

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// Map xAI voice names to OpenAI equivalents
const VOICE_MAP = { eve: 'nova', adam: 'onyx', grace: 'shimmer' };

// ─── Text to Speech ───────────────────────────────────────────────────────────
async function textToSpeech({ text, voice = 'eve', model = 'grok-3-audio' }) {
  const wordCount = text.split(/\s+/).length;
  const durationMs = Math.ceil((wordCount / 130) * 60 * 1000);

  // Try xAI first
  try {
    const response = await axios.post(
      `${XAI_BASE_URL}/audio/speech`,
      { model, input: text, voice, response_format: 'mp3', speed: 1.0 },
      {
        headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
      },
    );
    return { audioBuffer: Buffer.from(response.data), durationMs, voice };
  } catch (xaiError) {
    const errBody = xaiError.response?.data
      ? Buffer.isBuffer(xaiError.response.data)
        ? xaiError.response.data.toString()
        : JSON.stringify(xaiError.response.data)
      : xaiError.message;
    console.warn('xAI TTS failed, falling back to OpenAI TTS:', errBody);
  }

  // Fallback: OpenAI TTS
  try {
    const openaiVoice = VOICE_MAP[voice] || 'nova';
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: openaiVoice,
      input: text,
      response_format: 'mp3',
    });
    const audioBuffer = Buffer.from(await mp3.arrayBuffer());
    return { audioBuffer, durationMs, voice };
  } catch (openaiError) {
    console.error('OpenAI TTS error:', openaiError.message);
    throw new Error('Failed to convert text to speech');
  }
}

// ─── Speech to Text ───────────────────────────────────────────────────────────
async function speechToText({ audioBuffer, model = 'grok-3-audio', language = 'en' }) {
  try {
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mp3',
    });
    formData.append('model', model);
    formData.append('language', language);
    formData.append('response_format', 'json');

    const response = await axios.post(
      `${XAI_BASE_URL}/audio/transcriptions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      },
    );

    return {
      text: response.data.text,
      confidence: response.data.confidence || 0.95,
      language: response.data.language || language,
      duration: response.data.duration,
    };
  } catch (error) {
    console.error('xAI STT error:', error.response?.data || error.message);
    throw new Error('Failed to convert speech to text');
  }
}

module.exports = {
  textToSpeech,
  speechToText,
};
