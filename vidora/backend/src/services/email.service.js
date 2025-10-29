const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Email Verification Link: ${verificationUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Verify Your Email - Vidora TV',
      html: `
        <h2>Welcome to Vidora TV!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password Reset Link: ${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset - Vidora TV',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    });
  }
}

module.exports = new EmailService();