/**
 * Customer Authentication Middleware
 * Handles customer session cookies and authentication
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CUSTOMER_COOKIE_NAME = "customer_auth_token";
const CUSTOMER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Set customer authentication cookie
 */
export function setCustomerAuthCookie(
  response: NextResponse,
  token: string
): NextResponse {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: CUSTOMER_COOKIE_MAX_AGE,
    path: "/"
  });

  return response;
}

/**
 * Get customer authentication token from cookie
 */
export function getCustomerAuthToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[CUSTOMER_COOKIE_NAME] || null;
}

/**
 * Clear customer authentication cookie
 */
export function clearCustomerAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(CUSTOMER_COOKIE_NAME);
  return response;
}

/**
 * Verify customer authentication from request
 */
export async function verifyCustomerAuth(request: Request): Promise<{
  authenticated: boolean;
  customer?: {
    id: string;
    phoneNumber: string;
    name: string | null;
  };
  error?: string;
}> {
  const token = getCustomerAuthToken(request);

  if (!token) {
    return { authenticated: false, error: "No authentication token" };
  }

  try {
    const { getCustomerBySession } = await import("./customerAuthService");
    const customer = getCustomerBySession(token);

    if (!customer) {
      return { authenticated: false, error: "Invalid or expired session" };
    }

    return { authenticated: true, customer };
  } catch (error: any) {
    console.error("Customer auth verification error:", error);
    return { authenticated: false, error: error.message };
  }
}




