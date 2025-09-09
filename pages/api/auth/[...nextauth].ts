import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Attempt to connect to database
          try {
            await dbConnect();
          } catch (dbError: any) {
            console.error('Database connection failed during auth:', dbError.message);
            throw new Error('Authentication service temporarily unavailable');
          }
          
          const user = await User.findOne({ email: credentials.email });

          if (!user || user.provider !== 'credentials') {
            return null;
          }

          if (!user.emailVerified) {
            throw new Error('Please verify your email before signing in');
          }

          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Attempt to connect to database
          try {
            await dbConnect();
          } catch (dbError: any) {
            console.error('Database connection failed during Google sign-in:', dbError.message);
            return false; // Reject sign-in if database unavailable
          }
          
          const existingUser = await User.findOne({ email: user.email });
          
          if (existingUser) {
            // Update Google ID if not set
            if (!existingUser.googleId && account.providerAccountId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.provider = 'google';
              existingUser.emailVerified = true;
              await existingUser.save();
            }
          } else {
            // Create new user from Google
            const newUser = new User({
              email: user.email,
              name: user.name || profile?.name,
              image: user.image,
              provider: 'google',
              googleId: account.providerAccountId,
              emailVerified: true,
            });
            await newUser.save();
          }
          
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
      }
      
      if (account?.provider === 'google') {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.emailVerified = dbUser.emailVerified;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
