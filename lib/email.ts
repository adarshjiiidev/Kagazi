import nodemailer from 'nodemailer';
import { logger, createEmailError } from './error-handling';

// Email service types
export type EmailService = 'gmail' | 'sendgrid' | 'aws-ses' | 'smtp';

// Create transporter based on environment configuration
function createTransporter() {
  const service = process.env.EMAIL_SERVICE as EmailService || 'smtp';

  switch (service) {
    case 'gmail':
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Gmail service requires EMAIL_USER and EMAIL_PASS');
      }
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // App password, not regular password
        },
      });

    case 'sendgrid':
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid service requires SENDGRID_API_KEY');
      }
      return nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });

    case 'aws-ses':
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS SES service requires AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
      }
      return nodemailer.createTransporter({
        host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_ACCESS_KEY_ID,
          pass: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

    case 'smtp':
    default:
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP service requires SMTP_HOST, SMTP_USER, and SMTP_PASS');
      }
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
  }
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    try {
      transporter = createTransporter();
    } catch (error) {
      logger.error('Failed to create email transporter', error);
      throw createEmailError('transporter_creation', error);
    }
  }
  return transporter;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string; // Plain text version
}

export const sendEmail = async ({ to, subject, html, text }: EmailTemplate): Promise<boolean> => {
  try {
    const emailTransporter = getTransporter();
    
    // Determine from address based on service
    const fromEmail = process.env.EMAIL_FROM || 
                     process.env.EMAIL_USER || 
                     process.env.SMTP_USER || 
                     'noreply@kagazi.com';

    const info = await emailTransporter.sendMail({
      from: `Kagazi <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || extractTextFromHtml(html), // Fallback plain text
    });

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to,
      subject,
      service: process.env.EMAIL_SERVICE || 'smtp',
    });
    
    return true;
  } catch (error: any) {
    logger.error('Email sending failed', error, {
      to,
      subject,
      service: process.env.EMAIL_SERVICE || 'smtp',
    });
    
    // Provide specific error guidance
    if (error.message.includes('authentication') || error.code === 'EAUTH') {
      logger.warn('Email authentication failed - check credentials');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      logger.warn('Email connection failed - check network/firewall');
    }
    
    throw createEmailError('send_email', error);
  }
};

// Extract plain text from HTML for email clients that don't support HTML
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

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
