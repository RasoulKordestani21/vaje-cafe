import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./authService";

export interface AuthenticatedUser {
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  id: string;
}

/**
 * Middleware to validate session token from cookies or Authorization header
 * Usage: In API routes, call this to verify the user is authenticated
 */
export function validateSession(request: NextRequest): {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
} {
  try {
    // Get token from cookie first, then from Authorization header
    let token = request.cookies.get("auth_token")?.value;

    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "شما وارد سیستم نشده‌اید" },
          { status: 401 }
        )
      };
    }

    // Verify token
    const session = verifySessionToken(token);

    if (!session) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "جلسه منقضی شده است" },
          { status: 401 }
        )
      };
    }

    return {
      user: session as AuthenticatedUser,
      error: null
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return {
      user: null,
      error: NextResponse.json({ error: "خطای احراز هویت" }, { status: 401 })
    };
  }
}

/**
 * Middleware to validate admin token (for sensitive operations)
 * Usage: For admin-only endpoints like changing other user's passwords
 */
export function validateAdminSession(request: NextRequest): {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
} {
  const { user, error } = validateSession(request);

  if (error) {
    return { user: null, error };
  }

  // You can add additional admin checks here if needed
  // For example: check if user has admin role

  return { user, error: null };
}

/**
 * Helper to add authentication to response (refresh token, etc)
 */
export function setAuthCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 60 * 60, // 5 hours
    path: "/"
  });
  return response;
}

/**
 * Helper to clear authentication cookie
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/"
  });
  return response;
}
