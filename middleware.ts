import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect admin routes - customer routes are handled separately
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/(admin)")) {
    // Get admin auth token from cookies (secure HTTP-only cookie)
    const authToken = request.cookies.get("auth_token")?.value;

    // If not authenticated, redirect to admin login
    if (!authToken) {
      // Store the original URL to redirect back after login
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    // Note: Full token validation should happen in API routes
    // as they have database access. Middleware just checks existence.
  }

  // Customer routes (/customer/*, /menu) don't need middleware protection
  // They use CustomerContext for client-side authentication checks

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/(admin)/:path*"]
};
