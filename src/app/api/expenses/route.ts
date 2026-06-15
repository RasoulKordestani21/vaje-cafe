import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";
import { v4 as uuidv4 } from "uuid";

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

// GET all expenses (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let query = "SELECT * FROM expenses";
    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (dateFrom) {
      conditions.push("date >= ?");
      params.push(parseExpenseDate(dateFrom));
    }

    if (dateTo) {
      conditions.push("date <= ?");
      params.push(parseExpenseDate(dateTo));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY date DESC, createdAt DESC";

    const expenses = db.prepare(query).all(...params);

    // Calculate totals
    const totals = db.prepare(`
      SELECT 
        category,
        SUM(amount) as total
      FROM expenses
      ${conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""}
      GROUP BY category
    `).all(...params) as Array<{ category: string; total: number }>;

    const grandTotal = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

    return NextResponse.json({
      expenses,
      totals,
      grandTotal
    });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST create new expense
export async function POST(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const {
      category,
      amount,
      description,
      date
    } = body;

    if (!category || !amount || !date) {
      return NextResponse.json(
        { error: "دسته‌بندی، مبلغ و تاریخ الزامی است" },
        { status: 400 }
      );
    }

    if (!["rent", "bills", "staff_salaries", "other"].includes(category)) {
      return NextResponse.json(
        { error: "دسته‌بندی نامعتبر است" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "مبلغ باید بیشتر از صفر باشد" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const expenseId = uuidv4();

    // Convert date to timestamp if provided as ISO string
    const dateTimestamp = parseExpenseDate(date);

    db.prepare(`
      INSERT INTO expenses (id, category, amount, description, date, created_by, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expenseId,
      category,
      amount,
      description || null,
      dateTimestamp,
      auth.userId,
      now,
      now
    );

    const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(expenseId);

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

