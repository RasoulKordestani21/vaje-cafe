import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { getInventoryReportData } from "@/lib/reports/reportData";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? parseInt(searchParams.get("startDate")!, 10) : undefined;
    const endDate = searchParams.get("endDate") ? parseInt(searchParams.get("endDate")!, 10) : undefined;

    const db = getDatabase();
    const data = getInventoryReportData(db, { startDate, endDate });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Inventory report error:", error);
    return NextResponse.json({ error: "Failed to generate inventory report" }, { status: 500 });
  }
}
