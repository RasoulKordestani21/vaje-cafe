import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { getStaffReportData } from "@/lib/reports/reportData";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? parseInt(searchParams.get("startDate")!, 10) : undefined;
    const endDate = searchParams.get("endDate") ? parseInt(searchParams.get("endDate")!, 10) : undefined;
    const staffId = searchParams.get("staffId") || undefined;

    const db = getDatabase();
    const data = getStaffReportData(db, { startDate, endDate, staffId });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Staff report error:", error);
    return NextResponse.json({ error: "Failed to generate staff report" }, { status: 500 });
  }
}
