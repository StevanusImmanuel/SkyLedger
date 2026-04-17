import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // FIX: Changed from next/request

export function middleware(request: NextRequest) {
  const session = request.cookies.get('terminal_session');
  const { pathname } = request.nextUrl;

  // Define all protected terminal routes
  const protectedRoutes = ['/dashboard', '/shipment', '/reports', '/settings'];

  // Check if the current path starts with any of the protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    // Redirect unauthorized access to the restricted terminal page
    return NextResponse.redirect(new URL('/login/restricted', request.url));
  }

  return NextResponse.next();
}

// CRITICAL: Update the matcher to include all folders you want to protect
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/shipment/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};