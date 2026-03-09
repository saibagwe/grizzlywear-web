import { NextResponse } from 'next/server';

export function middleware() {
  // Bypassed for prototyping
  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout', '/admin/:path*'],
};
