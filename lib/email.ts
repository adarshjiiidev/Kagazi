import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailTemplate): Promise<boolean> => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured - email sending skipped');
    console.warn('   For email verification, configure SMTP settings in .env.local');
    console.warn('   See QUICK_SETUP.md for instructions');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message);
    
    if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.error('   Check your SMTP_USER and SMTP_PASS in .env.local');
      console.error('   For Gmail: Use App Passwords, not regular password');
    }
    
    return false;
  }
};

export const generateOTPEmailTemplate = (otp: string, name: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 30px;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .otp-box {
                background: white;
                border: 2px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 4px;
                color: #667eea;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
            .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📧 Email Verification</h1>
            <p>Welcome to Kagazi!</p>
        </div>
        <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>Thank you for signing up with Kagazi! To complete your email verification, please use the following One-Time Password (OTP):</p>
            
            <div class="otp-box">
                ${otp}
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes for security reasons.
            </div>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
            
            <p>Best regards,<br>The Kagazi Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2024 Kagazi. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
