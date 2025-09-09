import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import OTPVerification from '../../../models/OTPVerification';

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

    res.status(200).json({
      message: 'Email verified successfully! You can now sign in.',
      verified: true,
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: 'Internal server error. Please try again.' 
    });
  }
}
