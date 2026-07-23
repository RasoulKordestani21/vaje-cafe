import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { getReportData, type ReportType } from "@/lib/reports/reportData";
import { reportToCsv, REPORT_TYPE_LABELS } from "@/lib/reports/csvExport";
import { timestampToJalali } from "@/utils/jalaliDateUtils";

const VALID_TYPES: ReportType[] = ["sales", "inventory", "staff", "customers"];

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") as ReportType | null;
    const startDate = searchParams.get("startDate")
      ? parseInt(searchParams.get("startDate")!, 10)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? parseInt(searchParams.get("endDate")!, 10)
      : undefined;

    if (!reportType || !VALID_TYPES.includes(reportType)) {
      return NextResponse.json({ error: "نوع گزارش نامعتبر است" }, { status: 400 });
    }

    const db = getDatabase();
    const reportData = getReportData(db, reportType, startDate, endDate);
    const csv = reportToCsv(reportType, reportData);

    const today = timestampToJalali(Math.floor(Date.now() / 1000));
    const asciiFilename = `report-${reportType}-${today}.csv`;
    const utfFilename = `گزارش-${REPORT_TYPE_LABELS[reportType]}-${today}.csv`;

    return new NextResponse(new TextEncoder().encode(csv), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(utfFilename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "خطا در خروجی‌گیری گزارش";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
