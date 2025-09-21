import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import OTPVerification from '../../../models/OTPVerification';
import jwt from 'jsonwebtoken';

interface VerifyOTPRequest {
  email: string;
  otp: string;
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

    const { email, otp }: VerifyOTPRequest = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be 6 digits' });
    }

    // Find the OTP verification record
    const otpRecord = await OTPVerification.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'email_verification',
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      await OTPVerification.findByIdAndDelete(otpRecord._id);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Find and update the user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark user as verified
    user.emailVerified = true;
    await user.save();

    // Mark OTP as verified and delete all OTPs for this email
    await OTPVerification.deleteMany({
      email: email.toLowerCase(),
      type: 'email_verification',
    });

    // Generate JWT token for auto-login
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ 
        message: 'Server configuration error. Please contact support.' 
      });
    }

    const autoLoginToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        emailVerified: true,
        type: 'auto-login',
      },
      jwtSecret,
      { expiresIn: '10m' } // Short-lived token for auto-login
    );

    res.status(200).json({
      message: 'Email verified successfully! Signing you in...',
      verified: true,
      autoLogin: true,
      token: autoLoginToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: 'Internal server error. Please try again.' 
    });
  }
}
