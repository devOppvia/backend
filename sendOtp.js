const axios = require("axios");

async function sendMessage() {
  try {
    const response = await axios.post(
      "https://graph.facebook.com/v25.0/1251763954695782/messages",
      {
        messaging_product: "whatsapp",
        to: "9725398019",
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      },
      {
        headers: {
          Authorization: "Bearer YOUR_ACCESS_TOKEN",
          "Content-Type": "application/json",
        },
      },
    );

    console.log(response.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
}

sendMessage();
