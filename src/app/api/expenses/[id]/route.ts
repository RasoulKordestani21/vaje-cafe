import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";

initializeDatabase();

function parseExpenseDate(value: string | number): number {
  if (typeof value === "number") return value;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const year = parseInt(value.split("-")[0], 10);
    if (year >= 1300 && year <= 1500) return jalaliToTimestamp(value);
  }
  return Math.floor(new Date(value).getTime() / 1000);
}

// GET single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(params.id) as any;

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Expense GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PUT update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { category, amount, description, date } = body;

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Check if expense exists
    const existing = db.prepare("SELECT id FROM expenses WHERE id = ?").get(params.id) as { id: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (category !== undefined) {
      if (!["rent", "bills", "staff_salaries", "other"].includes(category)) {
        return NextResponse.json(
          { error: "دسته‌بندی نامعتبر است" },
          { status: 400 }
        );
      }
      updates.push("category = ?");
      values.push(category);
    }

    if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: "مبلغ باید بیشتر از صفر باشد" },
          { status: 400 }
        );
      }
      updates.push("amount = ?");
      values.push(amount);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (date !== undefined) {
      const dateTimestamp = parseExpenseDate(date);
      updates.push("date = ?");
      values.push(dateTimestamp);
    }

    updates.push("updatedAt = ?");
    values.push(now);
    values.push(params.id);

    db.prepare(`
      UPDATE expenses 
      SET ${updates.join(", ")}
      WHERE id = ?
    `).run(...values);

    const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(params.id);

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Expense PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const existing = db.prepare("SELECT id FROM expenses WHERE id = ?").get(params.id) as { id: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM expenses WHERE id = ?").run(params.id);

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Expense DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}

