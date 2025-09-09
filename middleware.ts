import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here
    console.log('Token:', req.nextauth.token);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          return true;
        }
        
        // Protect all other pages - require valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protect all routes except:
    // - Home page (/)
    // - API routes (except /api/auth)
    // - Static files
    // - Images
    // - Favicon
    // - Public auth pages
    '/((?!$|api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
