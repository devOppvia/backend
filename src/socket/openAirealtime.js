const WebSocket = require("ws");
require("dotenv").config();

exports.startRealtimeServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (client) => {
    console.log("🔌 Client connected");

    let openai = null;
    let audioQueue = [];
    let isOpenAIReady = false;
    let reconnectAttempts = 0;
    let reconnectTimeout = null;

    const MAX_QUEUE_SIZE = 20;
    const MAX_RETRIES = 5;

    const connectOpenAI = () => {
      if (reconnectAttempts >= MAX_RETRIES) {
        console.log("❌ Max retries reached. Stopping reconnect.");
        return;
      }

      console.log(`🔄 Connecting to OpenAI... (${reconnectAttempts})`);

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

        reconnectAttempts = 0;
        isOpenAIReady = true;

        // ✅ safer session config
        openai.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["audio", "text"],
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                silence_duration_ms: 300,
              },
            },
          }),
        );

        // ✅ Flush only small batch
        audioQueue.splice(0, 5).forEach((msg) => openai.send(msg));
      });

      openai.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());

          if (data.type === "error") {
            console.error("❌ OpenAI Error:", data);

            handleFailure();
            return;
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
        isOpenAIReady = false;
        handleFailure();
      });

      openai.on("error", (err) => {
        console.error("❌ WS error:", err.message);
        isOpenAIReady = false;
      });
    };

    // 🔁 smarter retry (exponential backoff)
    const handleFailure = () => {
      isOpenAIReady = false;

      // 🔥 clear queue (VERY IMPORTANT)
      audioQueue = [];

      reconnectAttempts++;

      const delay = Math.min(1000 * 2 ** reconnectAttempts, 10000);

      console.log(`⏳ Reconnecting in ${delay}ms...`);

      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connectOpenAI, delay);
    };

    connectOpenAI();

    // 🔹 Client → OpenAI
    client.on("message", (message) => {
      try {
        if (!isOpenAIReady || !openai || openai.readyState !== WebSocket.OPEN) {
          // 🚫 STOP spamming logs
          return;
        }

        openai.send(message);
      } catch (err) {
        console.error("❌ Send error:", err);
      }
    });

    client.on("close", () => {
      console.log("❌ Client disconnected");

      if (openai) openai.close();

      audioQueue = [];
      isOpenAIReady = false;
    });

    client.on("error", (err) => {
      console.error("Client error:", err.message);
    });
  });
};
