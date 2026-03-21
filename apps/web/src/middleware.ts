import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/account', '/checkout'];
const ADMIN_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebase-auth-token')?.value;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname.startsWith('/admin/dashboard') ? pathname : '/admin/dashboard');
      return NextResponse.redirect(loginUrl);
    }

    const role = request.cookies.get('user-role')?.value;
    if (role !== 'admin') {
      // Direct access without admin role -> landing page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Customer protected routes
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*', '/admin/:path*'],
};
