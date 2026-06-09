import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/tracking', '/pricing', '/map-test', '/unauthorized', '/login', '/login/auth', '/login/register', '/login/forgot-password', '/login/reset-password'];
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Check for session token
  const token = request.cookies.get('terminal_session')?.value;

  // If accessing protected route without token, redirect to unauthorized page
  if (!isPublicRoute && !token) {
    const unauthorizedUrl = new URL('/login/restricted', request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // If accessing login page with valid token, redirect to dashboard
  if (pathname.startsWith('/login') && token && pathname !== '/login/reset-password') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)',
  ],
};
