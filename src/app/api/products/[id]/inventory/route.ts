import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import {
  getInventoryLogs,
  recordInventoryTransaction,
  type InventoryOperation,
} from "@/services/productsService";

// GET inventory logs for a product
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

// POST buy / sell / update transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const operation = body.operation as InventoryOperation;
    const quantity = Number(body.quantity);
    const unitPrice =
      body.unitPrice !== undefined && body.unitPrice !== null
        ? Number(body.unitPrice)
        : undefined;
    const note = typeof body.note === "string" ? body.note : undefined;

    if (!["buy", "sell", "update"].includes(operation)) {
      return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
    }

    const result = recordInventoryTransaction(id, {
      operation,
      quantity,
      unitPrice,
      note,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Inventory transaction POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record transaction";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
