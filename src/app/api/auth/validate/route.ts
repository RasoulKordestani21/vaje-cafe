import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/adminApiAuth";

/**
 * Validate current admin auth — session cookie OR x-access-token.
 * Returns 200 if valid, 401 if invalid/expired.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { authenticated: false, error: "Session invalid or expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: auth.userId,
          email: auth.email,
          name: auth.name,
        },
        role: auth.role,
        method: auth.method,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Validation error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Validation failed" },
      { status: 401 }
    );
  }
}
