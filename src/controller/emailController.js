const pool = require("../config/db");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const { handleResponse } = require("../utilities/responseHandlers");

// send test mail
exports.testMail = async function (req, res) {
  const { to, subject, text } = req.body;
  const emailVariables = {
    hello_content: "Hy,",
    user_name: to,
    welcome_message: " Welcome to M TECHUB",
    body_1_content:
      "You are receiving this because you (or someone else) have requested the reset of the password for your account.",
    body_2_content:
      "If you did not sign up to PixInvent, please ignore this email or contact us at",
    main_url: "https://mtechub.com",
    button_1_link: "https://mtechub.com",
    button_1_content: "Visit M TECHUB",
    button_2_link: "https://mtechub.com",
    button_2_content: "Verify Email",
    footer_content: "Not sure why you received this email?",
    thankyou_note: "Thank you for using M TECHUB!",
  };
  ejs.renderFile(
    path.join(__dirname, "../template/emailTemplate.ejs"),
    {
      subject: subject,
      app_primary_color: process.env.APP_PRIMARY_COLOR,
      app_secondary_color: process.env.APP_SECONDARY_COLOR,
      logo_img: process.env.LOGO_IMAGE,
      admin_support_email: process.env.ADMIN_SUPPORT_EMAIL,
      support_email: process.env.SUPPORT_EMAIL,
      regards: process.env.REGARDS,
      instagram_link: process.env.INSTA_LINK,
      instagram_img_link: process.env.INSTA_IMAGE,
      facebook_link: process.env.FB_LINK,
      facebook_img_link: process.env.FB_IMAGE,
      twitter_link: process.env.TWITTER_LINK,
      twitter_img_link: process.env.TWITTER_IMAGE,
      terms_of_use_link: process.env.TERMS_OF_USE_LINK,
      privacy_policy_link: process.env.PRIVACY_POLICY_LINK,
      ...emailVariables,
    },

    async function (err, data) {
      if (err) {
        console.error("Error rendering email template:", err);
        handleResponse(res, "Internal server error", 500, []);
      } else {
        // send mail thing here
        let transporter = nodemailer.createTransport({
          service: "gmail",
          port: 25, // or 465 if you are using SSL
          secure: false, // true for 465, false for other ports
          auth: {
            user: "mtechub.info@gmail.com",
            pass: "qmhwyeixrfdpardu",
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        let mailOptions = {
          from: "testusama@mtechub.org",
          to: to,
          subject: subject,
          // text: text,
          html: data,
          // If you want to use HTML: html: '<b>Hello world?</b>',
        };

        try {
          let info = await transporter.sendMail(mailOptions);
          console.log("Message sent: %s", info.messageId);
          handleResponse(res, "email sent", 200, [
            {
              info: info,
            },
          ]);
        } catch (error) {
          console.error("Error sending email:", error);
          handleResponse(res, "email not sent", 500, []);
        }
      }
    }
  );
};
