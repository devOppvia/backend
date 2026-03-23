const { sendWebPushNotification } = require("./notificationHelper");

const fcmToken = "dwrwQ8KqMS0Imy869Jl76M:APA91bF2hRHFFOWH-i05ps8TO5D6_CNhe_2fRaW7RPL3QvtmC_vLB1gbQts5QrurwrmKfVO1pT9b5b2yV4K_herB7ExO1I4EnDXUVWPiDWOVr_ZVkDAraGc"; 
sendWebPushNotification(
  fcmToken,
  "Hello from Node.js!",
  "This is a test push notification",
  { customKey: "customValue" }
)
  .then(() => console.log("Notification sent successfully"))
  .catch((err) => console.error("Notification failed", err));
