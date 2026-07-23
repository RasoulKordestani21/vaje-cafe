import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { hashStaffPassword } from "@/lib/staffAuth";

// GET all staff (admin only)
export async function GET(request: NextRequest) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");
    const role = searchParams.get("role");

    let query = `
      SELECT s.*, b.name as branch_name
      FROM staff s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (branchId) {
      query += ` AND s.branch_id = ?`;
      params.push(branchId);
    }

    if (role) {
      query += ` AND s.role = ?`;
      params.push(role);
    }

    query += ` ORDER BY s.created_at DESC`;

    const staff = db.prepare(query).all(...params);

    const formattedStaff = (staff as any[]).map(s => ({
      ...s,
      is_active: Boolean(s.is_active),
      created_at: Number(s.created_at),
      updated_at: Number(s.updated_at),
      password_hash: undefined, // Don't send password hash
    }));

    return NextResponse.json({ staff: formattedStaff });
  } catch (error) {
    console.error("Staff GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST create new staff (admin only)
export async function POST(request: NextRequest) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const body = await request.json();
    const { name, phone, email, password, role, branch_id, accessible_tabs } = body;

    if (!name || !phone || !email || !password || !role) {
      return NextResponse.json(
        { error: "نام، شماره تماس، ایمیل، رمز عبور و نقش الزامی است" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "فرمت ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    if (!["waiter", "barista", "manager"].includes(role)) {
      return NextResponse.json(
        { error: "نقش نامعتبر است" },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existing = db.prepare("SELECT id FROM staff WHERE phone = ?").get(phone);
    if (existing) {
      return NextResponse.json(
        { error: "شماره تماس قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = db.prepare("SELECT id FROM staff WHERE email = ?").get(email);
    if (existingEmail) {
      return NextResponse.json(
        { error: "ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashStaffPassword(password);
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO staff (id, name, phone, email, password_hash, role, branch_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      phone,
      email,
      passwordHash,
      role,
      branch_id || null,
      1, // is_active
      now,
      now
    );

    // Set default tab permissions based on role (business logic)
    const defaultTabs: { [key: string]: string[] } = {
      waiter: ["orders"],           // Waiters: Only see orders (ready orders)
      barista: ["orders"],          // Baristas: Only see orders (pending/preparing)
      manager: ["dashboard", "orders", "stats"], // Managers: Dashboard, orders, and stats
    };

    const tabsToEnable = accessible_tabs || defaultTabs[role] || ["orders"];

    // Create tab permissions for this staff
    const tabPermStmt = db.prepare(`
      INSERT INTO staff_tab_permissions (id, staff_id, tab_name, enabled)
      VALUES (?, ?, ?, ?)
    `);

    for (const tab of tabsToEnable) {
      const tabPermId = crypto.randomUUID();
      tabPermStmt.run(tabPermId, id, tab, 1);
    }

    const newStaff = db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as any;

    return NextResponse.json(
      {
        ...newStaff,
        is_active: Boolean(newStaff.is_active),
        created_at: Number(newStaff.created_at),
        updated_at: Number(newStaff.updated_at),
        password_hash: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Staff POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create staff" },
      { status: 500 }
    );
  }
}

