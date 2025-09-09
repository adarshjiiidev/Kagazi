import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import OTPVerification from '../../../models/OTPVerification';
import { sendEmail, generateOTPEmailTemplate, generateOTP } from '../../../lib/email';

interface ResendOTPRequest {
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Attempt to connect to database
    try {
      await dbConnect();
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError.message);
      return res.status(503).json({ 
        message: 'Database service unavailable. Please check MongoDB setup and try again.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    const { email }: ResendOTPRequest = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists and is not verified
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (user.provider !== 'credentials') {
      return res.status(400).json({ message: 'This email is associated with social login' });
    }

    // Check rate limiting (only allow resend after 1 minute)
    const recentOTP = await OTPVerification.findOne({
      email: email.toLowerCase(),
      type: 'email_verification',
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // 1 minute ago
    });

    if (recentOTP) {
      return res.status(429).json({ 
        message: 'Please wait 1 minute before requesting another OTP' 
      });
    }

    // Generate and save new OTP
    const otp = generateOTP();
    
    // Delete any existing OTPs for this email
    await OTPVerification.deleteMany({ 
      email: email.toLowerCase(), 
      type: 'email_verification' 
    });

    const otpVerification = new OTPVerification({
      email: email.toLowerCase(),
      otp,
      type: 'email_verification',
    });

    await otpVerification.save();

    // Send verification email
    const emailSent = await sendEmail({
      to: email,
      subject: '🔐 Verify Your Email - Kagazi',
      html: generateOTPEmailTemplate(otp, user.name),
    });

    if (!emailSent) {
      await OTPVerification.findByIdAndDelete(otpVerification._id);
      
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(200).json({
      message: 'Verification code sent successfully. Please check your email.',
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Internal server error. Please try again.' 
    });
  }
}
