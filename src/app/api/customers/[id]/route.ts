import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";

// PATCH update customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authErr = ensureAdmin(request);
    if (authErr) return authErr;

    const db = getDatabase();
    const { name } = await request.json();

    db.prepare(
      `UPDATE customers SET name = ?, updatedAt = ? WHERE id = ?`
    ).run(
      name || null,
      Math.floor(Date.now() / 1000),
      params.id
    );

    const updatedCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(params.id);

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
