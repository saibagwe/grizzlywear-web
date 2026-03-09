import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/account', '/checkout'];

// Routes restricted to admin users
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  // Bypassed for prototyping
  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout', '/admin/:path*'],
};
