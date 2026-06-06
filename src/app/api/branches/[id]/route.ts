import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";

// GET single branch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const branch = db.prepare("SELECT * FROM branches WHERE id = ?").get(params.id);
    
    if (!branch) {
      return NextResponse.json(
        { error: "شعبه یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    return NextResponse.json(
      { error: "Failed to fetch branch" },
      { status: 500 }
    );
  }
}

// PUT update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authErr = ensureAdmin(request);
    if (authErr) return authErr;

    const db = getDatabase();
    const body = await request.json();
    const { name, address, phone, email, isActive } = body;

    // Check if branch exists
    const existing = db.prepare("SELECT * FROM branches WHERE id = ?").get(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: "شعبه یافت نشد" },
        { status: 404 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      UPDATE branches
      SET name = COALESCE(?, name),
          address = ?,
          phone = ?,
          email = ?,
          isActive = COALESCE(?, isActive),
          updatedAt = ?
      WHERE id = ?
    `).run(
      name?.trim() || null,
      address?.trim() || null,
      phone?.trim() || null,
      email?.trim() || null,
      typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
      now,
      params.id
    );

    const updated = db.prepare("SELECT * FROM branches WHERE id = ?").get(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 500 }
    );
  }
}

// DELETE branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authErr = ensureAdmin(request);
    if (authErr) return authErr;

    const db = getDatabase();

    // Check if branch exists
    const existing = db.prepare("SELECT * FROM branches WHERE id = ?").get(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: "شعبه یافت نشد" },
        { status: 404 }
      );
    }

    // Check if this is the last branch
    const branchCount = db.prepare("SELECT COUNT(*) as count FROM branches").get() as { count: number };
    if (branchCount.count <= 1) {
      return NextResponse.json(
        { error: "نمی‌توانید آخرین شعبه را حذف کنید" },
        { status: 400 }
      );
    }

    // Check if branch has orders
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE branchId = ?").get(params.id) as { count: number };
    if (orderCount.count > 0) {
      // Instead of deleting, deactivate it
      const now = Math.floor(Date.now() / 1000);
      db.prepare(`
        UPDATE branches
        SET isActive = 0, updatedAt = ?
        WHERE id = ?
      `).run(now, params.id);
      return NextResponse.json({ message: "شعبه غیرفعال شد (دارای سفارش است)" });
    }

    db.prepare("DELETE FROM branches WHERE id = ?").run(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 500 }
    );
  }
}




