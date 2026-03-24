const { JobStatus } = require("@prisma/client");
const nodemailer = require("nodemailer");

const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "",
    pass: "",
  },
  tls : {
    rejectUnauthorized : false
  }
});

const sendJobStatusMail = async (data) => {
  try {
    const { email, jobTitle, companyName, jobStatus, reason } = data;
    const statusColor =
      jobStatus === "APPROVED"
        ? "#4CAF50"
        : jobStatus === "REJECTED"
        ? "#F44336"
        : "#FFC107";

    const html = `
   <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job Status Update - ${jobTitle}</title>
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
        <!-- Header -->
              <tr>
                <td style="background-color:#0C3232; padding:25px 30px;">
                  <table width="100%">
                    <tr>
                      <td align="left" style="display : flex; gap : 10px">
                        <img src="https://talent.oppvia.in/full_logo.png"  alt="Oppvia" width="100px" />
                      </td>
                     
                    </tr>
                  </table>
                </td>
              </tr>

         

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Title -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 600; color: #1a1a1a; padding-bottom: 25px;">
                    Job Status Update
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; padding-bottom: 18px;">
                    Dear <strong>${companyName}</strong>,
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 20px;">
                    The status of your job posting <strong>"${jobTitle}"</strong> has been updated by the admin.
                  </td>
                </tr>

                <!-- Status Badge -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px 20px; width: 100%;">
                      <tr>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
                          <strong>Status:</strong> 
                          <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">${jobStatus}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  jobStatus === "REJECTED" && reason
                    ? `
                <!-- Rejection Reason -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 25px;">
                    <strong style="color: #333333;">Reason for Rejection:</strong><br/>
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin-top: 10px;">
                      ${reason}
                    </div>
                  </td>
                </tr>
                `
                    : ""
                }

                ${
                  jobStatus === "APPROVED"
                    ? `
                <!-- Success Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 25px;">
                    Congratulations! Your job posting is now live on our platform and visible to all candidates.
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Closing Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 30px;">
                    Thank you for using Oppvia. If you have any questions, please don't hesitate to contact us.
                  </td>
                </tr>

                <!-- Social Icons -->
                  <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 7.5px;">
                          <a href="https://instagram.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/instagram.png"
                                 alt="Instagram"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://linkedin.com/company/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/linkedin.png"
                                 alt="LinkedIn"
                                 width="41"
                                 height="41"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://facebook.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/facebook.png"
                                 alt="Facebook"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://youtube.com/@oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/youtube.png"
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
    `;
  
    await transporter.sendMail({
      from: `"Oppvia" <dev.oppvia@gmail.com>`,
      to: email,
      subject: `Job Status Updated: ${jobTitle}`,
      html,
    });

    console.warn(`✅ Email sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

const sendCompanyStatusMail = async (data) => {
  try {
    const { email, companyName, status, reason } = data;

    const statusColor = status === "APPROVED" ? "#4CAF50" : "#F44336";

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Company Status Update - ${companyName}</title>
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
                <td style="background-color:#0C3232; padding:25px 30px;">
                  <table width="100%">
                    <tr>
                      <td align="left" style="display : flex; gap : 10px">
                        <img src="https://talent.oppvia.in/full_logo.png"  alt="Oppvia" width="100px" />
                      </td>
                     
                    </tr>
                  </table>
                </td>
              </tr>

        

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- Title -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 600; color: #1a1a1a; padding-bottom: 25px;">
                    Company Status Update
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; padding-bottom: 18px;">
                    Dear <strong>${companyName}</strong>,
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 20px;">
                    The status of your company account has been updated by the admin.
                  </td>
                </tr>

                <!-- Status Badge -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px 20px; width: 100%;">
                      <tr>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
                          <strong>Status:</strong> 
                          <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">${status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  status === "REJECTED" && reason
                    ? `
                <!-- Rejection Reason -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 25px;">
                    <strong style="color: #333333;">Reason for Rejection:</strong><br/>
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin-top: 10px;">
                      ${reason}
                    </div>
                  </td>
                </tr>
                `
                    : ""
                }

                ${
                  status === "APPROVED"
                    ? `
                <!-- Success Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 25px;">
                    Congratulations! Your company account is now active and visible on our platform.
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Closing -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 30px;">
                    Thank you for being a part of Oppvia. If you have any questions, please don't hesitate to contact us.
                  </td>
                </tr>

                <!-- Social Icons -->
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 7.5px;">
                          <a href="https://instagram.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/instagram.png"
                                 alt="Instagram"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://linkedin.com/company/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/linkedin.png"
                                 alt="LinkedIn"
                                 width="41"
                                 height="41"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://facebook.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/facebook.png"
                                 alt="Facebook"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://youtube.com/@oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/youtube.png"
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
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 12px;">
                    If you have any questions, feel free to message us at
                    <a href="mailto:dev.oppvia@gmail.com" style="color: #2d5f5f; text-decoration: none;">dev.oppvia@gmail.com</a>.
                    All rights reserved.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 20px;">
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
    `;
{/* <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
        <div style="max-width: 600px; background: #ffffff; margin: auto; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: #2e86de; color: #fff; padding: 12px 20px; font-size: 18px; font-weight: bold;">
            OppVia
          </div>
          <div style="padding: 20px; line-height: 1.6;">
            <h2 style="color: #333;">Company Status Update</h2>
            <p>Dear <strong>${companyName}</strong>,</p>
            <p>Your company account status has been updated by the admin.</p>
            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
            ${
              status === "REJECTED" && reason
                ? `<p><strong>Reason for Rejection:</strong><br/>${reason}</p>`
                : ""
            }
            <p>Thank you for using our platform.</p>
            <br/>
            <p style="color: #555;">Regards,<br/>OppVia Team</p>
          </div>
        </div>
      </div> */}
    await transporter.sendMail({
      from: `"OppVia"  <dev.oppvia@gmail.com>`,
      to: email,
      subject: `Company Status Updated`,
      html,
    });

    console.warn(`✅ Company status email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending company status email:", error.message);
  }
};

const sendInternWithdrawMailToCompany = async (data) => {
  try {
    const { email, companyName, internName, jobTitle } = data;

    const html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Intern Application Withdrawn - ${companyName}</title>
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
         <!-- Header -->
              <tr>
                <td style="background-color:#0C3232; padding:25px 30px;">
                  <table width="100%">
                    <tr>
                      <td align="left" style="display : flex; gap : 10px">
                        <img src="https://talent.oppvia.in/full_logo.png"  alt="Oppvia" width="100px" />
                      </td>
                     
                    </tr>
                  </table>
                </td>
              </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- Title -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 600; color: #1a1a1a; padding-bottom: 25px;">
                    Intern Application Withdrawn
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; padding-bottom: 18px;">
                    Dear <strong>${companyName}</strong>,
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 20px;">
                    We would like to inform you that the following intern has withdrawn their job application:
                  </td>
                </tr>

                <!-- Intern Info -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #E8F5FF; border-left: 4px solid #2E86DE; padding: 15px 20px; width: 100%; border-radius: 4px;">
                      <tr>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; padding : 10px;">
                          <strong>Intern Name:</strong> ${internName}<br/><br/>
                          <strong>Job Title:</strong> ${jobTitle}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Additional Info -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 25px;">
                    You can view your remaining active applicants in your company dashboard.<br/>
                    If this withdrawal affects your hiring process, you can repost or reopen the position at any time.
                  </td>
                </tr>

                <!-- Closing -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 30px;">
                    Thank you for using Oppvia. Please feel free to reach out if you have any questions.
                  </td>
                </tr>

                <!-- Social Icons -->
                  <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 7.5px;">
                          <a href="https://instagram.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/instagram.png"
                                 alt="Instagram"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://linkedin.com/company/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/linkedin.png"
                                 alt="LinkedIn"
                                 width="41"
                                 height="41"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://facebook.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/facebook.png"
                                 alt="Facebook"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://youtube.com/@oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/youtube.png"
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
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 12px;">
                    If you have any questions, feel free to message us at
                    <a href="mailto:dev.oppvia@gmail.com" style="color: #2d5f5f; text-decoration: none;">dev.oppvia@gmail.com</a>.
                    All rights reserved.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 20px;">
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
    `;
  //   <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
  //   <div style="max-width: 600px; background: #ffffff; margin: auto; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
  //     <div style="background: #2e86de; color: #fff; padding: 12px 20px; font-size: 18px; font-weight: bold;">
  //       Oppvia
  //     </div>
  //     <div style="padding: 20px; line-height: 1.6;">
  //       <h2 style="color: #333;">Intern Application Withdrawn</h2>
  //       <p>Dear <strong>${companyName}</strong>,</p>
  //       <p>We would like to inform you that the following intern has withdrawn their job application:</p>

  //       <div style="background: #f0f8ff; padding: 12px 16px; border-radius: 6px; margin: 15px 0;">
  //         <p style="margin: 4px 0;"><strong>Intern Name:</strong> ${internName}</p>
  //         <p style="margin: 4px 0;"><strong>Job Title:</strong> ${jobTitle}</p>
  //       </div>

  //       <p>You can view your remaining active applicants in your company dashboard.</p>
  //       <p>If this withdrawal affects your hiring process, you can repost or reopen the position at any time.</p>

  //       <br/>
  //       <p style="color: #555;">Regards,<br/>Oppvia Team</p>
  //     </div>
  //   </div>
  // </div>
    await transporter.sendMail({
      from: `"Oppvia" <dev.oppvia@gmail.com>`,
      to: email,
      subject: `Intern Application Withdrawn`,
      html,
    });

    console.warn(`✅ Intern withdraw notification sent to company: ${email}`);
  } catch (error) {
    console.error("❌ Error sending intern withdraw mail:", error.message);
  }
};

const sendInternJoinMailToCompany = async (data) => {
  try {
    const { email, companyName, internName, jobTitle } = data;

    const html = `
     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Intern Offer Accepted - ${companyName}</title>
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
                <td style="background-color:#0C3232; padding:25px 30px;">
                  <table width="100%">
                    <tr>
                      <td align="left" style="display : flex; gap : 10px">
                        <img src="https://talent.oppvia.in/full_logo.png"  alt="Oppvia" width="100px" />
                      </td>
                     
                    </tr>
                  </table>
                </td>
              </tr>

          <!-- Banner -->
        

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- Title -->
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 26px; font-weight: 600; color: #1a1a1a; padding-bottom: 25px;">
                    Intern Offer Accepted 🎉
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; padding-bottom: 18px;">
                    Dear <strong>${companyName}</strong>,
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 20px;">
                    We are delighted to inform you that the following intern has <strong>accepted your offer</strong> and will be joining your organization:
                  </td>
                </tr>

                <!-- Intern Info -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #E9F7EF; border-left: 4px solid #4CAF50; padding: 15px 20px; width: 100%; border-radius: 4px;">
                      <tr>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; padding : 10px 20px;">
                          <strong style="padding-bottom: 25px;">Intern Name:</strong> ${internName}<br/><br/>
                          <strong>Job Title:</strong> ${jobTitle}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Additional Info -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 25px;">
                    We wish both your team and the intern a successful and productive internship journey ahead.<br/>
                    You can view all your active interns and their details in your company dashboard.
                  </td>
                </tr>

                <!-- Closing -->
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px; color: #555555; line-height: 1.7; padding-bottom: 30px;">
                    Thank you for partnering with Oppvia. We’re excited to see your collaboration grow!
                  </td>
                </tr>

                <!-- Social Icons -->
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 7.5px;">
                          <a href="https://instagram.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/instagram.png"
                                 alt="Instagram"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://linkedin.com/company/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/linkedin.png"
                                 alt="LinkedIn"
                                 width="41"
                                 height="41"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://facebook.com/oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/facebook.png"
                                 alt="Facebook"
                                 width="42"
                                 height="42"
                                 style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 7.5px;">
                          <a href="https://youtube.com/@oppvia" style="display: block;">
                            <img src="https://talent.oppvia.in/images/youtube.png"
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
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 12px;">
                    If you have any questions, feel free to message us at
                    <a href="mailto:dev.oppvia@gmail.com" style="color: #2d5f5f; text-decoration: none;">dev.oppvia@gmail.com</a>.
                    All rights reserved.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #888888; padding-bottom: 20px;">
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
    `;
  //   <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
  //   <div style="max-width: 600px; background: #ffffff; margin: auto; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
  //     <div style="background: #2e86de; color: #fff; padding: 12px 20px; font-size: 18px; font-weight: bold;">
  //       Oppvia
  //     </div>
  //     <div style="padding: 20px; line-height: 1.6;">
  //       <h2 style="color: #333;">Intern Offer Accepted</h2>
  //       <p>Dear <strong>${companyName}</strong>,</p>
  //       <p>We are pleased to inform you that the following intern has <strong>accepted your offer</strong> and will be joining your organization:</p>

  //       <div style="background: #e8f5e9; padding: 12px 16px; border-radius: 6px; margin: 15px 0; border-left: 5px solid #4CAF50;">
  //         <p style="margin: 4px 0;"><strong>Intern Name:</strong> ${internName}</p>
  //         <p style="margin: 4px 0;"><strong>Job Title:</strong> ${jobTitle}</p>
  //       </div>

  //       <p>We wish both your team and the intern a successful and productive internship journey ahead.</p>
  //       <p>You can view all your active interns and their details in your company dashboard.</p>

  //       <br/>
  //       <p style="color: #555;">Best Regards,<br/>Oppvia Team</p>
  //     </div>
  //   </div>
  // </div>
    await transporter.sendMail({
      from: `"Oppvia" <dev.oppvia@gmail.com>`,
      to: email,
      subject: `Intern Offer Accepted - ${internName}`,
      html,
    });

    console.warn(`✅ Intern joining confirmation sent to company: ${email}`);
  } catch (error) {
    console.error("❌ Error sending intern join mail:", error.message);
  }
};


const sendEmailOtp = async (data) => {
  try {
    const { email, otp } = data || {};

    const html = `
   <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>OTP Verification - Oppvia</title>
      <style type="text/css">
        body { margin:0; padding:0; background-color:#f1f1f1; font-family: Arial, sans-serif; }
        table { border-collapse:collapse; }
      </style>
    </head>
    <body style="margin:0; padding:0; background-color:#f1f1f1;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f1f1;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; max-width:600px; border-radius:8px; overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background-color:#0C3232; padding:25px 30px;">
                  <table width="100%">
                    <tr>
                      <td align="left" style="display : flex; gap : 10px">
                        <img src="https://talent.oppvia.in/full_logo.png"  alt="Oppvia" width="100px" />
                      </td>
                     
                    </tr>
                  </table>
                </td>
              </tr>

            

              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 20px;">
                  <h2 style="color:#333333; text-align:center; margin:0 0 20px;">Your OTP Verification Code</h2>
                  <p style="font-size:15px; color:#555555; text-align:center; line-height:1.7;">
                    Please use the following One-Time Password (OTP) to verify your email address.
                    <br/><br/>
                    <strong style="font-size:28px; color:#0C3232; letter-spacing:4px;">${otp}</strong>
                    <br/><br/>
                    This OTP is valid for <strong>3 minutes</strong>. Please do not share it with anyone for your security.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="border-top:1px solid #e5e5e5; padding:30px 40px 40px; text-align:center; font-size:13px; color:#888888;">
                  <p>Need help? Contact us at 
                    <a href="mailto:dev.oppvia@gmail.com" style="color:#2e86de; text-decoration:none;">dev.oppvia@gmail.com</a>
                  </p>
                  <p style="font-size:12px; color:#aaaaaa;">© ${new Date().getFullYear()} Oppvia. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"Oppvia" <dev.oppvia@gmail.com>`,
      to: email,
      subject: `Your OTP Code - ${otp}`,
      html,
    });

    console.log("email send ==========>")

  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
  }
};




module.exports = { sendJobStatusMail, sendCompanyStatusMail,sendInternWithdrawMailToCompany,sendInternJoinMailToCompany,sendEmailOtp };
