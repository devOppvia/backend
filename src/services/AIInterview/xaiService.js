const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';

// ─── Text to Speech ───────────────────────────────────────────────────────────
async function textToSpeech({ text, voice = 'eve', model = 'grok-3-audio' }) {
  try {
    const response = await axios.post(
      `${XAI_BASE_URL}/audio/speech`,
      {
        model,
        input: text,
        voice,
        response_format: 'mp3',
        speed: 1.0,
      },
      {
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      },
    );

    // Calculate approximate duration (assuming ~130 words per minute)
    const wordCount = text.split(/\s+/).length;
    const durationMs = Math.ceil((wordCount / 130) * 60 * 1000);

    return {
      audioBuffer: Buffer.from(response.data),
      durationMs,
      voice,
    };
  } catch (error) {
    console.error('xAI TTS error:', error.response?.data || error.message);
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
