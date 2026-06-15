import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { validateSession } from "@/lib/authMiddleware";

/** Session cookie or x-access-token — same pattern as /api/customers */
export function requireAdminAccess(
  request: NextRequest
): { authorized: true; userId: string | null } | { authorized: false; error: NextResponse } {
  const sessionAuth = validateSession(request);

  if (sessionAuth.user && !sessionAuth.error) {
    const db = getDatabase();
    const row = db
      .prepare("SELECT role FROM admin_users WHERE id = ?")
      .get(sessionAuth.user.id) as { role?: string } | undefined;

    if (row && (row.role === "admin" || row.role === "super_admin")) {
      return { authorized: true, userId: sessionAuth.user.id };
    }
  }

  if (ensureAdmin(request) === null) {
    return { authorized: true, userId: null };
  }

  return {
    authorized: false,
    error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  };
}
