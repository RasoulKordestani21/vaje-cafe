import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";

// PUT update waste record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();

    const {
      product_name,
      category,
      waste_type,
      quantity,
      unit,
      cost_per_unit,
      reason,
    } = body;

    // Check if record exists
    const existing = db.prepare("SELECT * FROM waste_records WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: "Waste record not found" }, { status: 404 });
    }

    const total_cost = quantity * cost_per_unit;
    const now = Math.floor(Date.now() / 1000);

    // Update waste record
    db.prepare(`
      UPDATE waste_records
      SET product_name = ?,
          category = ?,
          waste_type = ?,
          quantity = ?,
          unit = ?,
          cost_per_unit = ?,
          total_cost = ?,
          reason = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      product_name,
      category || null,
      waste_type,
      quantity,
      unit,
      cost_per_unit,
      total_cost,
      reason || null,
      now,
      id
    );

    const updated = db.prepare("SELECT * FROM waste_records WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...updated,
      // Timestamps are returned as numbers from SQLite
    });
  } catch (error) {
    console.error("Waste PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update waste record" },
      { status: 500 }
    );
  }
}

// DELETE waste record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    // Check if record exists
    const existing = db.prepare("SELECT * FROM waste_records WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: "Waste record not found" }, { status: 404 });
    }

    // Delete record
    db.prepare("DELETE FROM waste_records WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waste DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete waste record" },
      { status: 500 }
    );
  }
}

