// const axios = require("axios");

// const MODE = "test";

// const TEST_TOKEN =
//   "EAAUFU7klJIoBQZAdPcM22NSPRuZB6gQu2v9VNUDZCZCS1ReIIrjGH3rYSEDJnkdR3KAhYtYOZC76nKQZAyktMAXbx3Vzf5M9tcSEyR9ZCXyC2Y8PLgFdxQ8S6yfULDWf53PBR0qIaWDm5FLsJLwvEEbZCvpuw3pttufEiagpeErh2ToQqknmq8nlGhrX6VjgNrhgBXh8OtYi4HyZCuhPmODcVgoGmmzHza0ptmjDuSccsdW1lQ7VZCyswHh90kfYufRs8Ysvzxz9hIFmnnlYF4XZAc4geIx"
// const TEST_PHONE_NUMBER_ID = "930397020151427";

// const PROD_TOKEN = "YOUR_PROD_ACCESS_TOKEN";
// const PROD_PHONE_NUMBER_ID = "111222333444";

// const TEMPLATE = "oppvia_otp_template";

// const TOKEN = MODE === "production" ? PROD_TOKEN : TEST_TOKEN;
// const PHONE_NUMBER_ID =
//   MODE === "production" ? PROD_PHONE_NUMBER_ID : TEST_PHONE_NUMBER_ID;

// async function sendWhatsAppOTP(phone, otp) {
//   try {
//     const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

//     const payload = {
//       messaging_product: "whatsapp",
//       to: phone,
//       type: "template",
// //       template: {
//         name: TEMPLATE,
//         language: { code: "en_US" },
//         components: [
//           {
//             type: "body",
//             parameters: [{ type: "text", text: otp }],
//           },
//         ],
//       },
//     };

//     const response = await axios.post(url, payload, {
//       headers: {
// //         Authorization: `Bearer ${TOKEN}`,
//         "Content-Type": "application/json",
//       },
//     });

//     return response.data;
//   } catch (error) {
//     console.error("WhatsApp OTP Error:", error.response?.data || error.message);
//   }
// }

// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// (async () => {
//   const otp = generateOTP();
//   const phone = "919327511543"; 

//   await sendWhatsAppOTP(phone, otp);
// })();




const axios = require("axios");

const ACCESS_TOKEN = "EAAUFU7klJIoBQZAdPcM22NSPRuZB6gQu2v9VNUDZCZCS1ReIIrjGH3rYSEDJnkdR3KAhYtYOZC76nKQZAyktMAXbx3Vzf5M9tcSEyR9ZCXyC2Y8PLgFdxQ8S6yfULDWf53PBR0qIaWDm5FLsJLwvEEbZCvpuw3pttufEiagpeErh2ToQqknmq8nlGhrX6VjgNrhgBXh8OtYi4HyZCuhPmODcVgoGmmzHza0ptmjDuSccsdW1lQ7VZCyswHh90kfYufRs8Ysvzxz9hIFmnnlYF4XZAc4geIx";

const PHONE_NUMBER_ID = "930397020151427";

const TO_PHONE = "919327511543";

async function sendWhatsAppMessage() {
  try {
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: TO_PHONE,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US",
        },
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Message sent ✅", response.data);
  } catch (error) {
    console.error(
      "WhatsApp Error ❌",
      error.response?.data || error.message
    );
  }
}

// call function
sendWhatsAppMessage();
