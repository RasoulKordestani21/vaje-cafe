import { NextRequest, NextResponse } from "next/server";
import { calculateInventoryValue } from "@/services/inventoryService";

export async function GET(request: NextRequest) {
  try {
    const value = calculateInventoryValue();
    return NextResponse.json(value);
  } catch (error) {
    console.error("Error calculating inventory value:", error);
    return NextResponse.json(
      { error: "Failed to calculate inventory value" },
      { status: 500 }
    );
  }
}




