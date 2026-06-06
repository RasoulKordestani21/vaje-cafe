import { NextRequest, NextResponse } from "next/server";
import { getLowStockAlerts } from "@/services/inventoryService";

export async function GET(request: NextRequest) {
  try {
    const alerts = getLowStockAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching inventory alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory alerts" },
      { status: 500 }
    );
  }
}
