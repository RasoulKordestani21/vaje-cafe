import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";

// GET role permissions (admin only)
export async function GET(request: NextRequest) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const permissions = db.prepare(`
      SELECT * FROM staff_role_permissions ORDER BY role
    `).all() as any[];

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Permissions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

// PUT update role permissions (admin only)
export async function PUT(request: NextRequest) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const body = await request.json();
    const { role, permissions } = body;

    if (!role || !permissions) {
      return NextResponse.json(
        { error: "Role and permissions are required" },
        { status: 400 }
      );
    }

    const validRoles = ['waiter', 'barista', 'manager'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    
    // Update each permission
    const permissionKeys = Object.keys(permissions);
    for (const key of permissionKeys) {
      db.prepare(`
        UPDATE staff_role_permissions
        SET enabled = ?, updated_at = ?
        WHERE role = ? AND permission_key = ?
      `).run(
        permissions[key] ? 1 : 0,
        now,
        role,
        key
      );
    }

    // Get updated permissions
    const updated = db.prepare(`
      SELECT * FROM staff_role_permissions WHERE role = ?
    `).all(role) as any[];

    const result: { [key: string]: boolean } = {};
    for (const perm of updated) {
      result[perm.permission_key] = Boolean(perm.enabled);
    }

    return NextResponse.json({
      role,
      permissions: result,
    });
  } catch (error) {
    console.error("Permissions PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
