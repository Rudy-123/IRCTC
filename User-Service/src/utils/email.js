const logger = require("../config/logger");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    const msg = {
      to: email, // receiver email
      from: "rudrapatel47108@gmail.com", // Change this to your verified SendGrid sender email
      subject: "Welcome to IRCTC! Your Verification OTP",
      text: `Your OTP for registration is: ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0c1a40; text-align: center;">IRCTC Mock - Verification OTP</h2>
          <p>Hello,</p>
          <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your signup process.</p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; background-color: #f4f4f4; padding: 15px; letter-spacing: 5px; color: #d32f2f;">${otp}</p>
          </div>
          <p style="color: #666; font-size: 14px;"><strong>Note:</strong> This OTP is valid for the next 5 minutes. Please do not share it with anyone.</p>
          <br/>
          <p>Best regards,<br/>The IRCTC Team</p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    logger.info(`📧 SENDGRID: OTP [${otp}] sent successfully to ${email}`);
    return true;
  } catch (error) {
    logger.error("Error sending email via SendGrid: ", error);
    if (error.response) {
      logger.error(error.response.body);
    }
    return false;
  }
};

const verifyOtpEmail = async (meta) => {
  try {
    const msg = {
      to: meta.email,
      from: "rudrapatel47108@gmail.com",
      subject: "Email Verified - Welcome to IRCTC!",
      text: `Hi ${meta.firstName}, your email has been verified successfully. Welcome to IRCTC!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0c1a40; text-align: center;">Email Verified Successfully</h2>
          <p>Hello ${meta.firstName},</p>
          <p>Your email has been verified successfully. Your account is now active!</p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 18px; color: #4caf50;"><strong>✓ Welcome to IRCTC!</strong></p>
          </div>
          <p>You can now log in to your account and start booking your tickets.</p>
          <br/>
          <p>Best regards,<br/>The IRCTC Team</p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    logger.info(
      `📧 SENDGRID: Verification email sent successfully to ${meta.email}`,
    );
    return true;
  } catch (error) {
    logger.error("Error sending verification email via SendGrid: ", error);
    if (error.response) {
      logger.error(error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  verifyOtpEmail,
};
