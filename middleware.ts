import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if accessing admin routes
  if (pathname.startsWith('/dashboard')) {
    // Get auth status from cookies/localStorage (forwarded via headers)
    const authCookie = request.cookies.get('vaje_auth');

    // If not authenticated, redirect to login
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
