import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { getInventoryLogs } from "@/services/productsService";

// GET inventory logs for a product (legacy route — prefer /inventory)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const { id } = await Promise.resolve(params);
    const filter = request.nextUrl.searchParams.get("filter");
    const tab =
      filter === "buy" || filter === "sell" ? filter : ("all" as const);

    const logs = getInventoryLogs(id, tab);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Inventory logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory logs" },
      { status: 500 }
    );
  }
}
