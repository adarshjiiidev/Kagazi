# Quick Setup Guide

## MongoDB Setup (Required for Authentication)

You're getting MongoDB connection errors because MongoDB isn't set up yet. Here are your options:

### Option 1: MongoDB Atlas (Recommended - Free Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and verify your email
3. Create a new project (e.g., "Kagazi")
4. Click "Build a Database" and select **FREE** tier (M0 Sandbox)
5. Choose a cloud provider and region (any is fine)
6. Create a cluster name (e.g., "kagazi-cluster")
7. **Create database user**:
   - Username: `kagazi-user`
   - Password: Generate a secure password (save it!)
8. **Add IP Address**: Add `0.0.0.0/0` for now (allows all IPs)
9. Click "Finish and Close"
10. Click "Connect" → "Connect your application"
11. Copy the connection string and **replace `<password>` with your actual password**
12. Update your `.env.local` file:

```bash
MONGODB_URI=mongodb+srv://kagazi-user:YOUR_ACTUAL_PASSWORD@kagazi-cluster.xxxxx.mongodb.net/kagazi-auth
```

**⚠️ Common Mistake**: Make sure to replace `<password>` with your actual password, not the literal text `<password>`!

### Option 2: Local MongoDB

1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Your `.env.local` should already have:
```bash
MONGODB_URI=mongodb://localhost:27017/kagazi-auth
```

## Environment Variables Setup

1. Update your `.env.local` file with real values:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-key-change-this-in-production

# MongoDB Configuration (UPDATE THIS)
MONGODB_URI=your-mongodb-connection-string-here

# Google OAuth (Optional - for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SMTP Configuration (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@kagazi.com

# JWT Secret
JWT_SECRET=another-secret-key-for-otp-tokens
```

2. Generate secure secrets:
   - For Windows: Use an online generator or create your own random strings
   - The secrets should be at least 32 characters long

## Testing the Setup

1. Make sure MongoDB is connected (no connection errors in console)
2. Visit `http://localhost:3000`
3. Click "START TRADING" to test signup
4. Click "LOGIN" to test signin

## Features Available

- ✅ **Home page** - Landing page with auth options
- ✅ **Sign up** - `/auth/register` (redirects to `/auth/signup`)
- ✅ **Sign in** - `/auth/login` (redirects to `/auth/signin`)  
- ✅ **Email verification** - `/auth/verify` (requires SMTP setup)
- ✅ **Google OAuth** - (requires Google credentials)
- ✅ **Protected dashboard** - `/dashboard` (requires authentication)

## Troubleshooting

**MongoDB Connection Failed:**
- Make sure MongoDB is running (if local) or connection string is correct (if Atlas)
- Check firewall settings
- Verify the database name in the connection string

**MongoDB Authentication Failed (Error code 8000):**
- ❌ `[MongoServerError: bad auth : authentication failed]`
- This means your username/password is incorrect
- Double-check your MONGODB_URI in `.env.local`
- Make sure you replaced `<password>` with your actual password
- Username and password are case-sensitive
- Try recreating the database user in MongoDB Atlas

**ECONNREFUSED Error:**
- ❌ Connection refused means MongoDB server is not reachable
- For local MongoDB: Start the MongoDB service
- For Atlas: Check your connection string format

**Email Not Sending:**
- Email verification is optional for testing
- You can skip SMTP setup and manually verify users in the database
- For Gmail: Use App Passwords, not your regular password

**Google OAuth Not Working:**
- This is optional for basic functionality
- You can test with email/password authentication first
