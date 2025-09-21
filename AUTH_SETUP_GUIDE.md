# 🔐 KAGAZI Authentication System Setup Guide

## Overview

Your Kagazi application now has a **production-ready authentication system** with the following features:

✅ **Auto-login after registration** - Users are automatically signed in after email verification  
✅ **Multiple email providers** - Gmail, SendGrid, AWS SES, or custom SMTP  
✅ **Enhanced security** - Rate limiting, password validation, secure cookies  
✅ **Professional templates** - Beautiful email templates with responsive design  
✅ **Production hardened** - CSRF protection, secure headers, comprehensive logging  

---

## 🚀 Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Required variables:**
```env
# Authentication
NEXTAUTH_SECRET=your-super-secure-random-string-32-characters-minimum
NEXTAUTH_URL=http://localhost:3000

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kagazi

# Email Service (choose one)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# OAuth (optional but recommended)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Generate Secure Secret

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Install Dependencies

All required packages are already included in your `package.json`:

```bash
npm install
# or
yarn install
```

---

## 📧 Email Service Configuration

### Option 1: Gmail (Easiest for Testing)

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate an app password
3. Configure:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password
```

### Option 2: SendGrid (Recommended for Production)

1. Create account at [SendGrid](https://sendgrid.com)
2. Generate API key
3. Configure:

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Option 3: AWS SES (Enterprise)

1. Set up AWS SES in your AWS account
2. Verify your sending domain
3. Configure:

```env
EMAIL_SERVICE=aws-ses
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
EMAIL_FROM=noreply@yourdomain.com
```

---

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters (configurable)
- Uppercase and lowercase letters
- At least one number
- Special characters (optional)
- Protection against common passwords

### Rate Limiting
- Registration: 5 attempts per 15 minutes
- OTP verification: 3 attempts per 10 minutes
- OTP resend: 1 per minute

### Security Headers
- CSRF protection
- XSS protection
- Content type validation
- Secure cookies in production
- HSTS for HTTPS

---

## 🎯 Authentication Flow

### New User Registration
1. **Sign Up** → User fills registration form with password strength meter
2. **Email Sent** → OTP sent to user's email with professional template
3. **Email Verification** → User enters 6-digit OTP
4. **Auto-Login** → User is automatically signed in after verification
5. **Dashboard Access** → Redirected to dashboard immediately

### Returning User
1. **Sign In** → Enter email and password
2. **Session Created** → Secure session with 30-day expiry
3. **Dashboard Access** → Access to all protected routes

---

## 🛡️ Middleware Protection

Protected routes are automatically secured:

```typescript
// Automatically protected routes:
/dashboard/*
/profile/*
/settings/*
/trades/*
/portfolio/*
/analytics/*

// API routes requiring authentication:
/api/user/*
/api/trades/*
/api/portfolio/*
```

---

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use HTTPS domain for `NEXTAUTH_URL`
3. Configure production database
4. Set up production email service

### Security Checklist
- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database secured with authentication
- [ ] Email service configured with proper SPF/DKIM
- [ ] Rate limiting configured appropriately
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Regular security updates scheduled

### Performance Optimization
- [ ] CDN configured for static assets
- [ ] Database indexes optimized
- [ ] Email templates cached
- [ ] Session cleanup automated

---

## 🧪 Testing the Flow

### Manual Testing Steps

1. **Registration Test:**
   ```
   1. Go to /auth/signup
   2. Fill form with valid data
   3. Check password strength meter
   4. Submit form
   5. Check email for OTP
   6. Enter OTP on verification page
   7. Should auto-login to dashboard
   ```

2. **Login Test:**
   ```
   1. Go to /auth/signin
   2. Enter credentials
   3. Should redirect to dashboard
   4. Check session persistence
   ```

3. **Security Test:**
   ```
   1. Try accessing /dashboard without login
   2. Should redirect to signin
   3. Try multiple failed login attempts
   4. Should trigger rate limiting
   ```

### Automated Testing

```bash
# Run authentication tests (if implemented)
npm test auth
```

---

## 🔧 Advanced Configuration

### Custom Password Requirements

Modify in `.env.local`:
```env
MIN_PASSWORD_LENGTH=12
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SYMBOLS=true
```

### Session Management

```env
SESSION_MAX_AGE=2592000  # 30 days
JWT_MAX_AGE=2592000      # 30 days
```

### Rate Limiting

```env
AUTH_RATE_LIMIT=10       # Per 15 minutes
OTP_RATE_LIMIT=5         # Per 10 minutes
RESEND_OTP_RATE_LIMIT=2  # Per minute
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending:**
   - Check email service configuration
   - Verify credentials and permissions
   - Check spam folder
   - Enable debug logging in development

2. **Database connection failed:**
   - Verify MongoDB URI format
   - Check network connectivity
   - Ensure database allows connections

3. **Session not persisting:**
   - Verify `NEXTAUTH_SECRET` is set
   - Check cookie settings in browser
   - Ensure HTTPS in production

4. **Rate limiting too aggressive:**
   - Adjust limits in environment variables
   - Clear rate limit cache in development

### Debug Mode

Enable detailed logging in development:

```env
NODE_ENV=development
AUTH_DEBUG=true
```

### Log Monitoring

Check application logs for authentication events:
- User registration attempts
- Email sending status
- Login successes/failures
- Security violations
- Rate limit triggers

---

## 📚 API Reference

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP code
- `GET/POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current session

### Response Format

```typescript
// Success Response
{
  success: true,
  data: { /* response data */ },
  message?: string
}

// Error Response
{
  success: false,
  error: "ERROR_TYPE",
  message: "User-friendly message",
  shouldRetry: boolean,
  errorCode?: string
}
```

---

## 🔄 Migration from Basic Auth

If you had a basic authentication system before:

1. **Database Migration:**
   - User schema is compatible with existing data
   - Email verification field added automatically

2. **Component Updates:**
   - All forms now include enhanced validation
   - Password strength meter integrated
   - Error handling improved

3. **API Updates:**
   - Endpoints now use comprehensive error handling
   - Rate limiting automatically applied
   - Logging integrated throughout

---

## 🤝 Support

### Resources
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Nodemailer Documentation](https://nodemailer.com/)

### Getting Help
1. Check this guide first
2. Review application logs
3. Check environment variable configuration
4. Verify network connectivity

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Email service tested and working
- [ ] Database connected and secured
- [ ] OAuth providers configured (optional)
- [ ] Password requirements set appropriately
- [ ] Rate limiting configured for your needs
- [ ] HTTPS enabled in production
- [ ] Security headers verified
- [ ] Complete authentication flow tested
- [ ] Error monitoring in place
- [ ] Backup strategy implemented

**🎉 Congratulations! Your authentication system is now production-ready!**
