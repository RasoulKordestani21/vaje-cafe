import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

// GET all site settings
export async function GET(request: NextRequest) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const settings = db.prepare("SELECT * FROM site_settings ORDER BY key").all();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT update site settings (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const updateStmt = db.prepare(`
      UPDATE site_settings 
      SET value = ?, updatedAt = ?, updatedBy = ?
      WHERE key = ?
    `);
    const insertStmt = db.prepare(`
      INSERT INTO site_settings (id, key, value, type, description, updatedAt, updatedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let hasThemeUpdate = false;

    for (const setting of settings) {
      const { key, value, type = "text", description } = setting;
      
      if (!key) continue;

      // Check if setting exists
      const existing = db.prepare("SELECT id FROM site_settings WHERE key = ?").get(key) as { id: string } | undefined;
      
      if (existing) {
        updateStmt.run(value || null, now, auth.userId, key);
      } else {
        insertStmt.run(uuidv4(), key, value || null, type, description || null, now, auth.userId);
      }

      // Check if any theme settings were updated
      if (key.startsWith("theme_")) {
        hasThemeUpdate = true;
      }
    }

    const response = NextResponse.json({ success: true, message: "Settings updated successfully" });
    
    // Add header to indicate theme update (client will listen for this)
    if (hasThemeUpdate) {
      response.headers.set("X-Theme-Updated", "true");
    }

    return response;
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

