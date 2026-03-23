const admin = require("firebase-admin");
const serviceAccount = require("../../../internship-d855d-firebase-adminsdk-fbsvc-7d2168634b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
