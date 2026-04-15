const WebSocket = require("ws");
require("dotenv").config();
exports.startRealtimeServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (client) => {
    console.log("🔌 Client connected");

  let openai = null;



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

   openai.on("open", () => {
     console.log("✅ Connected to OpenAI");

     openai.send(
       JSON.stringify({
         type: "session.update",
         session: {
           modalities: ["text"],
           input_audio_format: "pcm16",
           output_audio_format: "pcm16",
           turn_detection: { type: "server_vad" },
         },
       }),
     );
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
    client.on("message", (data) => {
        console.log("message from client", data)
      if (openai?.readyState === WebSocket.OPEN) {
        openai.send(data);
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
