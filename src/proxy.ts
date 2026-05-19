import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('terminal_session')?.value;
  const { pathname } = request.nextUrl;

  // Define all protected terminal routes
  const protectedRoutes = ['/dashboard', '/shipments', '/reports', '/settings'];

  // Routes that should redirect to dashboard if already authenticated
  const authRoutes = ['/login/auth', '/login/register'];

  // Check if the current path starts with any of the protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login/restricted', request.url));
  }

  // If accessing auth routes with a token, verify it and redirect to dashboard if valid
  if (isAuthRoute && token) {
    try {
      const verifyRes = await fetch(new URL('/api/users?me=true', request.url), {
        headers: {
          Cookie: `terminal_session=${token}`,
        },
      });

      if (verifyRes.ok) {
        // Token is valid, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (err) {
      // If verification fails, allow access to auth routes
      console.error('Token verification failed:', err);
    }
  }

  return NextResponse.next();
}

// CRITICAL: Update the matcher to include all folders you want to protect
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/shipments/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/login/auth',
    '/login/register',
  ],
};