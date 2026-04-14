const fs = require("fs");
const path = require("path");

async function downloadFreeVoices() {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": "sk_1d5018d3c58a0e3f79c80d7fd3a92cbba7662fa05a0b8c50",
      },
    });

    const data = await response.json();

    console.log("API Response:", data);

    if (!data.voices) {
      console.error("❌ API Error:", data);
      return;
    }

    const freeVoices = data.voices.filter((v) => v.category === "premade");

    console.log("Filtered voices:", freeVoices.length);

    const textContent = freeVoices
      .map((v) => `Name: ${v.name}, ID: ${v.voice_id}`)
      .join("\n");

    const filePath = path.join(__dirname, "free_voice.txt");

    fs.writeFileSync(filePath, textContent);

    console.log("✅ File saved at:", filePath);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

downloadFreeVoices();
