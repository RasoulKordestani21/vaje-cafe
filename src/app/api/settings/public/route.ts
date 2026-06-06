import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";

initializeDatabase();

// GET public site settings (no auth required)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const settings = db.prepare("SELECT key, value FROM site_settings").all();
    
    // Convert to key-value object for easier access
    const settingsMap: Record<string, string> = {};
    (settings as Array<{ key: string; value: string | null }>).forEach(s => {
      settingsMap[s.key] = s.value || "";
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Public settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

