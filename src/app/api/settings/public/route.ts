import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";

initializeDatabase();

/**
 * Keys that are considered internal/admin-only and should NOT be exposed
 * through the public endpoint. Theme tokens are already served by /api/theme.
 */
const EXCLUDED_PREFIXES = ["theme_"];

// GET public site settings — no auth required
export async function GET(_request: NextRequest) {
  try {
    const db = getDatabase();
    const rows = db
      .prepare("SELECT key, value FROM site_settings")
      .all() as Array<{ key: string; value: string | null }>;

    const settings: Record<string, string> = {};
    for (const { key, value } of rows) {
      if (EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
      settings[key] = value ?? "";
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Public settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
