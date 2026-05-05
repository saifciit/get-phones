import nodemailer from 'nodemailer';
import env from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailService = {
  async sendVerificationLink(email: string, token: string) {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to EasyPhones!</h2>
        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #007bff; word-break: break-all;">${link}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 EasyPhones. All rights reserved.</p>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Verify your EasyPhones account',
      html,
    });
  },

  async sendPasswordResetLink(email: string, token: string) {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
        <p>We received a request to reset your password. Please click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link is valid for 15 minutes. If you didn't request a password reset, please ignore this email.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #dc3545; word-break: break-all;">${link}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 EasyPhones. All rights reserved.</p>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  },
};
