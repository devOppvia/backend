const WebSocket = require("ws");
require("dotenv").config();

exports.startRealtimeServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (client) => {
    console.log("🔌 Client connected");

    let openai = null;
    let audioQueue = [];
    let isOpenAIReady = false;
    let reconnectTimeout = null;

    const MAX_QUEUE_SIZE = 50;

    // 🔁 Connect to OpenAI
    const connectOpenAI = () => {
      if (openai && openai.readyState === WebSocket.OPEN) return;

      console.log("🔄 Connecting to OpenAI...");

      openai = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            "OpenAI-Beta": "realtime=v1",
          },
        },
      );

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

        // ✅ Flush queue
        audioQueue.forEach((msg) => openai.send(msg));
        audioQueue = [];
      });

      openai.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());

          // 👇 Handle OpenAI errors
          if (data.type === "error") {
            console.error("❌ OpenAI Error:", data);

            if (data.error?.type === "server_error") {
              console.log("🔁 Retrying due to server error...");
              safeReconnect();
              return;
            }
          }

          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        } catch (err) {
          console.error("❌ Parse error:", err);
        }
      });

      openai.on("close", () => {
        console.log("❌ OpenAI disconnected");
        isOpenAIReady = false;

        // 🔥 clear queue (important)
        audioQueue = [];

        safeReconnect();
      });

      openai.on("error", (err) => {
        console.error("❌ OpenAI WS error:", err.message);
        isOpenAIReady = false;
      });
    };

    // 🔁 Safe reconnect with delay
    const safeReconnect = () => {
      if (reconnectTimeout) return;

      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectOpenAI();
      }, 2000);
    };

    connectOpenAI();

    // 🔹 Frontend → OpenAI
    client.on("message", (message) => {
      try {
        if (!openai || openai.readyState !== WebSocket.OPEN || !isOpenAIReady) {
          console.log("⏳ Queueing audio...");

          // 🚫 prevent memory leak
          if (audioQueue.length >= MAX_QUEUE_SIZE) {
            audioQueue.shift();
          }

          audioQueue.push(message);
          return;
        }

        openai.send(message);
      } catch (err) {
        console.error("❌ Failed to forward:", err);
      }
    });

    // 🔹 Client disconnect
    client.on("close", () => {
      console.log("❌ Client disconnected");

      if (openai && openai.readyState === WebSocket.OPEN) {
        openai.close();
      }

      audioQueue = [];
      isOpenAIReady = false;
    });

    client.on("error", (err) => {
      console.error("❌ Client WS error:", err.message);
    });
  });
};
