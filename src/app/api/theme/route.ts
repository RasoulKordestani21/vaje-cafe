import { NextRequest, NextResponse } from "next/server";
import { getThemeConfig } from "@/lib/themeService.server";

// GET theme configuration
export async function GET(request: NextRequest) {
  try {
    const config = await getThemeConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Theme GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

