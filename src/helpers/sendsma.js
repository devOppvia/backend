const twilio = require('twilio');


const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER; 


const sendWhatsAppOTP = async (phoneNumber, otp) => {
    console.log("in whats app")
  try {
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    // Format number (India default)
    let formattedNumber = phoneNumber;

    if (!formattedNumber.startsWith("+")) {
      if (formattedNumber.length === 10) {
        formattedNumber = `+91${formattedNumber}`;
      } else {
        formattedNumber = `+${formattedNumber}`;
      }
    }

    const to = `whatsapp:${formattedNumber}`;

    const message = await client.messages.create({
      body: `Your OTP is ${otp}. Do not share it with anyone.`,
      from: WHATSAPP_FROM,
      to: to,
    });

    console.log("✅ WhatsApp OTP sent:", message.sid);
    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("❌ WhatsApp OTP Error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendWhatsAppOTP;