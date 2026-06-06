import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

// GET single setting by key
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const db = getDatabase();
    const setting = db.prepare("SELECT * FROM site_settings WHERE key = ?").get(params.key) as any;

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

// PUT update single setting
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin can update settings
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { value, type, description } = body;

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Check if setting exists
    const existing = db.prepare("SELECT id FROM site_settings WHERE key = ?").get(params.key) as { id: string } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE site_settings 
        SET value = ?, type = ?, description = ?, updatedAt = ?, updatedBy = ?
        WHERE key = ?
      `).run(value || null, type || "text", description || null, now, user.id, params.key);
    } else {
      db.prepare(`
        INSERT INTO site_settings (id, key, value, type, description, updatedAt, updatedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), params.key, value || null, type || "text", description || null, now, user.id);
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

