const WebSocket = require("ws");
require("dotenv").config();
exports.startRealtimeServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (client) => {



    console.log("🔌 Client connected");

  let openai = null;

let audioQueue = [];
let isOpenAIReady = false;

    // 🔹 Create OpenAI connection
    const connectOpenAI = () => {
          if (openai && openai.readyState === WebSocket.OPEN) return;

      openai = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            "OpenAI-Beta": "realtime=v1",
          },
        },
      );

//       if (openai.readyState !== WebSocket.OPEN) {
//   console.log("⚠️ OpenAI not connected, skipping audio");
//   return;
// }

 openai.on("open", () => {
  console.log("✅ Connected to OpenAI");
  isOpenAIReady = true;

  openai.send(
    JSON.stringify({
      type: "session.update",
      session: {
        modalities: ["audio", "text"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: { type: "server_vad" },
      },
    }),
  );

  // ✅ Flush queued messages
  audioQueue.forEach((msg) => openai.send(msg));
  audioQueue = [];
});;

    openai.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());

        console.log("📩 OpenAI:", data);

        if (data.type === "error") {
          console.error("❌ OpenAI Error:", data);
        }

        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      } catch (err) {
        console.error("Parse error:", err);
      }
    });

      openai.on("close", () => {
  console.log("❌ OpenAI disconnected");
});

      openai.on("error", (err) => {
        console.error("OpenAI WS error:", err.message);
      });
    };

    connectOpenAI();

    // 🔹 Frontend → OpenAI
client.on("message", (message) => {
  try {
    if (!openai || openai.readyState !== WebSocket.OPEN) {
      console.log("⏳ Queueing audio...");
      audioQueue.push(message);
      return;
    }

    openai.send(message);
  } catch (err) {
    console.error("❌ Failed to forward to OpenAI:", err);
  }
});

    // 🔹 Cleanup
    client.on("close", () => {
      console.log("❌ Client disconnected");
      if (openai?.readyState === WebSocket.OPEN) {
        openai.close();
      }
    });

    client.on("error", (err) => {
      console.error("Client WS error:", err.message);
    });
  });
};
