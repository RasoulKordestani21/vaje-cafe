import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { verifyStaffAuth } from "@/lib/staffAuthMiddleware";

// GET current staff member's permissions
export async function GET(request: NextRequest) {
  const auth = await verifyStaffAuth(request);

  if (!auth.authenticated || !auth.staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const permissions = db
      .prepare(
        "SELECT permission_key, enabled FROM staff_role_permissions WHERE role = ? AND enabled = 1"
      )
      .all(auth.staff.role) as Array<{ permission_key: string; enabled: number }>;

    const permissionKeys = permissions.map((p) => p.permission_key);

    return NextResponse.json({
      role: auth.staff.role,
      permissions: permissionKeys,
    });
  } catch (error) {
    console.error("My permissions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

