import { NextRequest, NextResponse } from "next/server";
import { getRestockRecommendations } from "@/services/inventoryService";

export async function GET(request: NextRequest) {
  try {
    const recommendations = getRestockRecommendations();
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error fetching restock recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch restock recommendations" },
      { status: 500 }
    );
  }
}




