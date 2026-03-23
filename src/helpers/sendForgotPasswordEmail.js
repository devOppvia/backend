const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
   auth: {
    user: "dev.oppvia@gmail.com",
    pass: "rekz qfke prgw wxus",
  },
  tls : {
    rejectUnauthorized : false
  }
});

/**
 * Send Forgot Password Email
 * @param {string} to - Recipient email
 */
// const sendForgotPasswordEmail = async (to) => {
//   try {
//     const resetUrl = `http://192.168.1.11:5173/reset-password?email=${to}`;

//     const mailOptions = {
//       from: `"OppVia" <dev.oppvia@gmail.com>`,
//       to,
//       subject: "Reset Your Password",
//       html: `
//         <div style="font-family: sans-serif; text-align: center;">
//           <h2>Forgot Your Password?</h2>
//           <p>Click the button below to reset your password:</p>
//           <a href="${resetUrl}"
//              style="
//                display: inline-block;
//                padding: 12px 24px;
//                background-color: #1D4ED8;
//                color: white;
//                text-decoration: none;
//                border-radius: 6px;
//                margin-top: 10px;
//              ">
//             Reset Password
//           </a>
//           <p style="margin-top: 20px; font-size: 12px; color: #555;">
//             If you didn't request a password reset, ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.warn(`✅ Forgot password email sent to ${to}`);
//     return true;
//   } catch (err) {
//     console.error("❌ Error sending email:", err);
//     return false;
//   }
// };

const sendForgotPasswordEmail = async (
  to,
  userName = "User",
) => {
  try {
     // =============================
    // 1. Capture send time
    // =============================
    const sentAt = new Date();

    // dd-mm-yyyy
    const formattedDate = sentAt
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

    // HH:mm
    const formattedTime = sentAt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // ISO (for expiry/security)
    const sentAtISO = sentAt.toISOString();

    // =============================
    // 2. Reset URL (FRONTEND PORT 5173)
    // =============================
    const resetUrl = `http://192.168.1.11:5173/reset-password?email=${to}&sentAt=${sentAtISO}`;

    // 🔍 DEBUG (must show sentAt)
    console.log("RESET URL SENT:", resetUrl);
    // const resetUrl = `http://192.168.1.11:5173/reset-password?email=${to}`;

    const mailOptions = {
      from: `"OppVia" <dev.oppvia@gmail.com>`,
      to,
      subject: "Reset Your Oppvia Password",
      html: `
<!DOCTYPE html
    PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Oppvia Password</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    p {
      display: block;
      margin: 13px 0;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: rgb(241, 241, 241);">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgb(241, 241, 241);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600"
          style="max-width: 600px; background-color: #F6F6F6;">

          <tr>
            <td style="background-color: #0C3232; padding: 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/logo.png" alt="OPPVIA Logo" width="120"
                      style="display: block; border: 0; outline: none; text-decoration: none;" />
                  </td>
                  <td align="right"
                    style="color: #ffffff; font-family: Arial, sans-serif; font-size: 13px;">
                    ${new Date().toLocaleDateString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0;">
              <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/banner.png" alt="Banner Img" width="600" height="250"
                style="display: block; width: 100%; max-width: 600px; height: 250px; object-fit: cover;" />
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center"
                    style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 600; color: #1a1a1a; padding-bottom: 25px;">
                    Reset Your Oppvia Password
                  </td>
                </tr>

                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; padding-bottom: 18px;">
                    Hi ${userName},
                  </td>
                </tr>

                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 30px;">
                    We received a request to reset your password for your Oppvia account. If you made this request,
                    click the button below to set a new password:
                  </td>
                </tr>

                <tr>
                  <td align="left" style="padding-bottom: 30px;">
                    <a href="${resetUrl}"
                      style="background-color: #2B5F60; border-radius: 4px; color: #ffffff; display: inline-block;
                      font-family: Arial, sans-serif; font-size: 15px; font-weight: 500; line-height: 44px;
                      text-align: center; text-decoration: none; width: 160px;">Reset Password</a>
                  </td>
                </tr>

                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 13px; color: #666666; line-height: 1.7; padding-bottom: 35px;">
                    This link will expire in 30 minutes for your security.<br />
                    If you didn't request a password reset, please ignore this email — your password will remain
                    unchanged.
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 7.5px;">
                          <a href="#"><img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/ig.png" alt="Instagram" width="42" height="42" style="display: block;" /></a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="#"><img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/link.png" alt="LinkedIn" width="42" height="42" style="display: block;" /></a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="#"><img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/fb.png" alt="Facebook" width="42" height="42" style="display: block;" /></a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="#"><img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/yt.png" alt="YouTube" width="42" height="42" style="display: block;" /></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td style="border-top: 1px solid #e5e5e5; padding: 30px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center"
                    style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 12px;">
                    If you have any questions, feel free to message us at
                    <a href="mailto:support@mailax.com" style="color: #2d5f5f; text-decoration: none;">support@mailax.com</a>.
                    All rights reserved.
                  </td>
                </tr>

                <tr>
                  <td align="center"
                    style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 20px;">
                    5781 Spring St, Saltias, Idaho 836626<br />United States
                  </td>
                </tr>

                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 11px;">
                    <a href="#" style="color: #999999; text-decoration: none;">Terms of use</a>
                    <span style="color: #ddd; padding: 0 10px;">|</span>
                    <a href="#" style="color: #999999; text-decoration: none;">Privacy Policy</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return false;
  }
};

const sendForgotPasswordEmailIntern = async (to, userName) => {
  try {
    const resetUrl = `http://192.168.1.11:3000/reset-password?email=${to}`;

    const mailOptions = {
      from: `"OppVia" <dev.oppvia@gmail.com>`,
      to,
      subject: "Reset Your Password",
      html: `
       <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Oppvia Password</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    p {
      display: block;
      margin: 13px 0;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f1f1f1;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f1f1;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #F6F6F6;">

          <!-- Header -->
          <tr>
            <td style="background-color: #0C3232; padding: 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/logo.png" 
                         alt="OPPVIA Logo" 
                         width="120"
                         style="display: block; border: 0; outline: none; text-decoration: none;" />
                  </td>
                  <td align="right" style="color: #ffffff; font-family: Arial, sans-serif; font-size: 13px;">
                                        ${new Date().toLocaleDateString()}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Image -->
          <tr>
            <td align="center" style="padding: 0;">
              <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/banner.png" 
                   alt="Team meeting" 
                   width="600" 
                   height="250"
                   style="display: block; width: 100%; max-width: 600px; height: 250px; object-fit: cover;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Title -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 600; color: #1a1a1a; padding-bottom: 25px;">
                    Reset Your Oppvia Password
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; padding-bottom: 18px;">
                    Hi ${userName},
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 30px;">
                    We received a request to reset your password for your Oppvia account. If you made this request, click the button below to set a new password:
                  </td>
                </tr>

                <!-- Reset Button -->
                <tr>
                  <td align="left" style="padding-bottom: 30px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" 
                                 href="${resetUrl}" 
                                 style="height:44px;v-text-anchor:middle;width:160px;" 
                                 arcsize="10%" 
                                 stroke="f" 
                                 fillcolor="#2B5F60">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:500;">Reset Password</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetUrl}" 
                       style="background-color: #2B5F60; border-radius: 4px; color: #ffffff; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; font-weight: 500; line-height: 44px; text-align: center; text-decoration: none; width: 160px; -webkit-text-size-adjust: none; mso-hide: all;">
                      Reset Password
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>

                <!-- Security Note -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 13px; color: #666666; line-height: 1.7; padding-bottom: 35px;">
                    This link will expire in 30 minutes for your security.<br />
                    If you didn't request a password reset, please ignore this email — your password will remain unchanged.
                  </td>
                </tr>

                <!-- Social Icons -->
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 7.5px;">
                          <a href="https://instagram.com/oppvia" style="display: block;">
                            <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/ig.png" 
                                 alt="Instagram" 
                                 width="42" 
                                 height="42" 
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://linkedin.com/company/oppvia" style="display: block;">
                            <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/link.png" 
                                 alt="LinkedIn" 
                                 width="42" 
                                 height="42" 
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://facebook.com/oppvia" style="display: block;">
                            <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/fb.png" 
                                 alt="Facebook" 
                                 width="42" 
                                 height="42" 
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://youtube.com/@oppvia" style="display: block;">
                            <img src="https://oppvia-api.mykidstoryapp.com/api/v1/get-email-templates/yt.png" 
                                 alt="YouTube" 
                                 width="42" 
                                 height="42" 
                                 style="display: block;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #e5e5e5; padding: 30px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Contact -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 12px;">
                    If you have any questions, feel free to message us at
                    <a href="mailto:dev.oppvia@gmail.com" style="color: #2d5f5f; text-decoration: none;">dev.oppvia@gmail.com</a>.
                    All rights reserved.
                  </td>
                </tr>

                <!-- Address -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 20px;">
                    5781 Spring St, Saltias, Idaho 836626<br />
                    United States
                  </td>
                </tr>

                <!-- Legal Links -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 11px;">
                    <a href="#" style="color: #999999; text-decoration: none;">Terms of use</a>
                    <span style="color: #ddd; padding: 0 10px;">|</span>
                    <a href="#" style="color: #999999; text-decoration: none;">Privacy Policy</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.warn(`✅ Forgot password email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return false;
  }
};

module.exports = { sendForgotPasswordEmail, sendForgotPasswordEmailIntern };
