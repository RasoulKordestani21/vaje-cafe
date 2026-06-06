import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";

/**
 * Validate current session/auth cookie
 * Returns 200 if valid, 401 if invalid/expired
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);

    if (error || !user) {
      return NextResponse.json(
        { authenticated: false, error: "Session invalid or expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        role: user.role
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
