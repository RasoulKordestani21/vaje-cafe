import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { validateSession } from "@/lib/authMiddleware";

export type AdminAuthResult =
  | {
      authenticated: true;
      userId: string | null;
      role: "admin" | "super_admin";
      email?: string | null;
      name?: string | null;
      method: "session" | "token";
    }
  | { authenticated: false };

/** Session cookie or x-access-token — same pattern as protected admin APIs */
export function getAdminAuth(request: NextRequest): AdminAuthResult {
  const sessionAuth = validateSession(request);

  if (sessionAuth.user && !sessionAuth.error) {
    const db = getDatabase();
    const row = db
      .prepare("SELECT role, email, name FROM admin_users WHERE id = ?")
      .get(sessionAuth.user.id) as
      | { role?: string; email?: string; name?: string }
      | undefined;

    if (row && (row.role === "admin" || row.role === "super_admin")) {
      return {
        authenticated: true,
        userId: sessionAuth.user.id,
        role: row.role as "admin" | "super_admin",
        email: row.email ?? sessionAuth.user.email,
        name: row.name ?? sessionAuth.user.name,
        method: "session",
      };
    }
  }

  if (ensureAdmin(request) === null) {
    return {
      authenticated: true,
      userId: null,
      role: "super_admin",
      email: null,
      name: null,
      method: "token",
    };
  }

  return { authenticated: false };
}

/** Session cookie or x-access-token — super_admin only */
export function requireSuperAdminAccess(
  request: NextRequest
): { authorized: true; userId: string | null } | { authorized: false; error: NextResponse } {
  const auth = getAdminAuth(request);

  if (!auth.authenticated) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (auth.role !== "super_admin") {
    return {
      authorized: false,
      error: NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 }),
    };
  }

  return { authorized: true, userId: auth.userId };
}

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
