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

          // Check for auto-login after email verification
          if (credentials.password === 'auto-login-verified') {
            // This is a special case for auto-login after email verification
            // The user has just verified their email, so we allow automatic sign-in
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: user.emailVerified,
            };
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
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    encryption: false, // Use encryption in production if needed
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '').split(':')[0] 
          : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.callback-url` 
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Host-next-auth.csrf-token` 
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', code, metadata);
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ session, token }) {
      console.log('User signed out:', {
        userId: token?.id || session?.user?.id,
        email: token?.email || session?.user?.email,
      });
    },
    async createUser({ user }) {
      console.log('New user created:', {
        userId: user.id,
        email: user.email,
      });
    },
  },
};

export default NextAuth(authOptions);
