import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/login/auth', '/login/register', '/login/forgot-password', '/login/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check for session token
  const token = request.cookies.get('terminal_session')?.value;

  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !token && pathname.startsWith('/')) {
    const loginUrl = new URL('/login/auth', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page with valid token, redirect to dashboard
  if (isPublicRoute && token && pathname !== '/login/reset-password') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
