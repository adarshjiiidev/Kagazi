import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]';

interface AutoLoginRequest {
  token: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  emailVerified: boolean;
  type: string;
  iat: number;
  exp: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is already authenticated
    const session = await getServerSession(req, res, authOptions);
    if (session) {
      return res.status(200).json({
        message: 'User already authenticated',
        redirectTo: '/dashboard',
      });
    }

    const { token }: AutoLoginRequest = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ 
        message: 'Server configuration error' 
      });
    }

    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid or expired token' 
      });
    }

    // Validate token type
    if (payload.type !== 'auto-login') {
      return res.status(400).json({ 
        message: 'Invalid token type' 
      });
    }

    // Connect to database and verify user
    await dbConnect();
    const user = await User.findById(payload.userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ 
        message: 'Email not verified' 
      });
    }

    // Return user data for client-side session creation
    res.status(200).json({
      message: 'Token validated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
      redirectTo: '/dashboard',
    });

  } catch (error) {
    console.error('Auto-login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
}
