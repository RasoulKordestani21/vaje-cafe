import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

// GET all expenses (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view expenses
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

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
      const fromTimestamp = typeof dateFrom === "string" ? Math.floor(new Date(dateFrom).getTime() / 1000) : dateFrom;
      conditions.push("date >= ?");
      params.push(fromTimestamp);
    }

    if (dateTo) {
      const toTimestamp = typeof dateTo === "string" ? Math.floor(new Date(dateTo).getTime() / 1000) : dateTo;
      conditions.push("date <= ?");
      params.push(toTimestamp);
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
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create expenses
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

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
    const dateTimestamp = typeof date === "string" ? Math.floor(new Date(date).getTime() / 1000) : date;

    db.prepare(`
      INSERT INTO expenses (id, category, amount, description, date, created_by, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expenseId,
      category,
      amount,
      description || null,
      dateTimestamp,
      user.id,
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

