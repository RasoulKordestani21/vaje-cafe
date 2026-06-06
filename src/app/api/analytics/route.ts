import { NextRequest, NextResponse } from "next/server";
import { getEnhancedAnalytics } from "@/services/analyticsService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate")
      ? parseInt(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? parseInt(searchParams.get("endDate")!)
      : undefined;

    const analytics = await getEnhancedAnalytics(startDate, endDate);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}




