const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Mã OTP - AutoCare",
    html: `<p>Mã OTP của bạn là: <b>${otp}</b></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email OTP đã gửi:", email);
  } catch (error) {
    console.error("Gửi OTP thất bại:", error);
    throw error;
  }
}

module.exports = { sendOTP };
