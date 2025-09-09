import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import OTPVerification from '../../../models/OTPVerification';
import { sendEmail, generateOTPEmailTemplate, generateOTP } from '../../../lib/email';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
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

    const { email, password, name }: RegisterRequest = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user (not verified yet)
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      name,
      provider: 'credentials',
      emailVerified: false,
    });

    await newUser.save();

    // Generate and save OTP
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
      html: generateOTPEmailTemplate(otp, name),
    });

    if (!emailSent) {
      // Rollback user creation if email fails
      await User.findByIdAndDelete(newUser._id);
      await OTPVerification.findByIdAndDelete(otpVerification._id);
      
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification code.',
      userId: newUser._id,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Internal server error. Please try again.' 
    });
  }
}
