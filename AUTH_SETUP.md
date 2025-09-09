# Kagazi Authentication System

A complete authentication system built with NextAuth.js, MongoDB, and email verification.

## Features

- ✅ **Email/Password Authentication** with OTP verification
- ✅ **Google OAuth** authentication 
- ✅ **MongoDB** for data persistence
- ✅ **Email verification** with SMTP
- ✅ **Session management** with NextAuth
- ✅ **Type safety** with TypeScript
- ✅ **Modern UI** with Tailwind CSS and shadcn/ui

## Setup Instructions

### 1. Environment Variables

Update your `.env.local` file with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/kagazi-auth
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/kagazi-auth

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@kagazi.com

# JWT Secret for OTP
JWT_SECRET=your-jwt-secret-for-otp-tokens
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env.local`

### 3. Email/SMTP Setup

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the app password in `SMTP_PASS`

For other providers, update SMTP settings accordingly.

### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Update MONGODB_URI=mongodb://localhost:27017/kagazi-auth
```

**Option B: MongoDB Atlas**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and update `MONGODB_URI`

### 5. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET  
openssl rand -base64 32
```

## Usage

### Authentication Flow

1. **Sign Up**: `/auth/signup`
   - User enters email, password, name
   - Account created (unverified)
   - OTP sent to email

2. **Email Verification**: `/auth/verify`
   - User enters 6-digit OTP
   - Account becomes verified
   - Can now sign in

3. **Sign In**: `/auth/signin`
   - Email/password or Google OAuth
   - Redirects to dashboard on success

### API Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification  
- `POST /api/auth/resend-otp` - Resend OTP
- `/api/auth/[...nextauth]` - NextAuth endpoints

### Components

- `LoginForm` - Email/password + Google sign in
- `SignupForm` - User registration form
- `OTPVerification` - Email verification with OTP
- `SessionProvider` - Wraps app with auth context

### Pages

- `/auth/signin` - Sign in page
- `/auth/signup` - Registration page
- `/auth/verify` - Email verification page
- `/auth/error` - Authentication error page
- `/dashboard` - Protected dashboard (requires auth)

## Database Models

### User Schema
```typescript
{
  email: string (unique, required)
  password?: string (hashed, required for credentials)
  name: string (required)
  image?: string
  emailVerified: boolean (default: false)
  provider: 'credentials' | 'google'
  googleId?: string (unique for Google users)
  createdAt: Date
  updatedAt: Date
}
```

### OTP Verification Schema
```typescript
{
  email: string (required)
  otp: string (6 digits, required)
  type: 'email_verification' | 'password_reset'
  expiresAt: Date (10 minutes from creation)
  verified: boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

## Security Features

- 🔒 **Password hashing** with bcrypt (12 rounds)
- 🔒 **OTP expiration** (10 minutes)
- 🔒 **Rate limiting** on OTP resend (1 minute)
- 🔒 **Email verification** required for credentials auth
- 🔒 **Secure session** management with NextAuth
- 🔒 **Input validation** on all forms and APIs
- 🔒 **CSRF protection** built into NextAuth

## Testing

1. Start development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000` (home page)

3. Test the complete flow:
   - Click "START TRADING" or "LOGIN" from home page
   - Create account at `/auth/signup`
   - Check email for OTP
   - Verify email at `/auth/verify`
   - Sign in at `/auth/signin`
   - Access protected dashboard at `/dashboard`
   - Home page header will show user avatar and dashboard link when logged in

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP credentials
   - Verify app password for Gmail
   - Check spam folder

2. **MongoDB connection failed**
   - Verify MONGODB_URI format
   - Check network connectivity
   - Ensure database name is correct

3. **Google OAuth not working**
   - Verify redirect URI matches exactly
   - Check if Google+ API is enabled
   - Confirm client ID and secret

4. **OTP expired/invalid**
   - OTPs expire in 10 minutes
   - Only one OTP valid per email at a time
   - Check for typos in 6-digit code

### Debug Tips

- Check browser console for client errors
- Check server logs for API errors
- Verify environment variables are loaded
- Test database connection separately

## Next Steps

- Add password reset functionality
- Implement email change verification
- Add social login providers (GitHub, etc.)
- Add rate limiting middleware
- Set up monitoring and logging

## File Structure

```
├── app/
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify/page.tsx
│   │   └── error/page.tsx
│   ├── dashboard/page.tsx
│   └── layout.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── OTPVerification.tsx
│   └── SessionProvider.tsx
├── lib/
│   ├── mongodb.ts
│   └── email.ts
├── models/
│   ├── User.ts
│   └── OTPVerification.ts
├── pages/api/auth/
│   ├── [...nextauth].ts
│   ├── register.ts
│   ├── verify-otp.ts
│   └── resend-otp.ts
├── types/
│   └── next-auth.d.ts
├── middleware.ts
├── global.d.ts
└── .env.local
```
