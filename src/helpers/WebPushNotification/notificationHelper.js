const admin = require("./firebaseAdmin");

/**
 * Send a web push notification
 * @param {string} fcmToken - FCM token of the client
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional custom data
 */
async function sendWebPushNotification(fcmToken, title, body, data = {}) {
  if (!fcmToken) {
    throw new Error("FCM token is required");
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data,
    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        icon: "/favicon.ico",
        click_action: "/",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.warn("✅ Notification sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    throw error;
  }
}

module.exports = { sendWebPushNotification };
