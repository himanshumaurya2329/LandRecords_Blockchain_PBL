import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(email: string, otp: string, name: string = 'User') {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'E-Land Records - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">E-Land Records</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello ${name},</p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Thank you for registering with E-Land Records. To complete your account verification, please use the following OTP (One-Time Password):
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">Your OTP is:</p>
              <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 5px;">${otp}</p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              If you did not request this OTP, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              E-Land Records - Digital Land Management System<br>
              © 2024 All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}
