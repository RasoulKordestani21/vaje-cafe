import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { requireSuperAdminAccess, requireAdminAccess } from "@/lib/adminApiAuth";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

// GET single setting by key — requires admin (read-only)
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const setting = db
      .prepare("SELECT * FROM site_settings WHERE key = ?")
      .get(params.key) as Record<string, unknown> | undefined;

    if (!setting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Setting GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch setting" },
      { status: 500 }
    );
  }
}

// PUT update single setting — super_admin only
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { value, type, description } = body;

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const existing = db
      .prepare("SELECT id FROM site_settings WHERE key = ?")
      .get(params.key) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE site_settings
         SET value = ?, type = ?, description = ?, updatedAt = ?, updatedBy = ?
         WHERE key = ?`
      ).run(value ?? null, type ?? "text", description ?? null, now, auth.userId, params.key);
    } else {
      db.prepare(
        `INSERT INTO site_settings (id, key, value, type, description, updatedAt, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(uuidv4(), params.key, value ?? null, type ?? "text", description ?? null, now, auth.userId);
    }

    return NextResponse.json({ success: true, message: "Setting updated successfully" });
  } catch (error) {
    console.error("Setting PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
