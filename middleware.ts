import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/trades',
  '/portfolio',
  '/analytics',
];

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/login',
  '/auth/register',
];

// Define public routes (always accessible)
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/auth/verify',
  '/auth/error',
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    
    // Add security headers to all responses
    const response = NextResponse.next();
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS header for production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // CSP header for additional security
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-src 'none'",
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);

    // Redirect authenticated users away from auth pages
    if (token && authRoutes.some(route => pathname.startsWith(route))) {
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') || '/dashboard';
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // Log authentication events (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth Middleware:', {
        pathname,
        authenticated: !!token,
        userEmail: token?.email,
      });
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
          return true;
        }
        
        // Allow access to auth pages
        if (authRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        
        // Protect API routes
        if (pathname.startsWith('/api/')) {
          // Allow NextAuth API routes
          if (pathname.startsWith('/api/auth/')) {
            return true;
          }
          
          // Protect other API routes
          return !!token;
        }
        
        // Protect dashboard and other protected routes
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token && token.emailVerified === true;
        }
        
        // Default: require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
