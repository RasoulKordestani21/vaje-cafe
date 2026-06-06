import { NextRequest, NextResponse } from "next/server";
import {
  recordEvent,
  getStats as getStatsData,
  initStatsTable,
  getCategoryBreakdown
} from "@/lib/statsService";

// Initialize stats table on first import
initStatsTable();

// GET statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate")
      ? parseInt(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? parseInt(searchParams.get("endDate")!)
      : undefined;

    const stats = getStatsData(startDate, endDate);
    const categoryBreakdown = getCategoryBreakdown();

    // Return comprehensive dashboard data
    return NextResponse.json({
      ...stats,
      categoryBreakdown
    });
  } catch (error) {
    console.error("Stats GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

// PATCH increment visit count
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log(`[Stats PATCH] Recording ${action} event:`, data);

    if (!action || !["visit", "order", "menu_view"].includes(action)) {
      console.warn(`[Stats PATCH] Invalid action: ${action}`);
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 'order' recording should be protected
    if (action === "order") {
      const { ensureAdmin } = await import("@/lib/auth");
      const authErr = ensureAdmin(request);
      if (authErr) return authErr;
    }

    recordEvent(action as any, data);
    console.log(`[Stats PATCH] Successfully recorded ${action} event`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stats PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update statistics" },
      { status: 500 }
    );
  }
}

// POST to record events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData } = body;

    if (!eventType || !["visit", "order", "menu_view"].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    recordEvent(eventType as any, eventData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stats POST error:", error);
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 }
    );
  }
}
