import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";

// GET inventory logs for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const logs = db
      .prepare(`
        SELECT * FROM inventory_logs 
        WHERE productId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `)
      .all(id);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Inventory logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory logs" },
      { status: 500 }
    );
  }
}

