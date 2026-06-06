import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { hashStaffPassword } from "@/lib/staffAuth";

// GET staff by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const staff = db.prepare(`
      SELECT s.*, b.name as branch_name
      FROM staff s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...staff,
      is_active: Boolean(staff.is_active),
      created_at: Number(staff.created_at),
      updated_at: Number(staff.updated_at),
      password_hash: undefined,
    });
  } catch (error) {
    console.error("Staff GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// PUT update staff
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { name, phone, email, password, role, branch_id, is_active } = body;

    const existing = db.prepare("SELECT * FROM staff WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }

    if (phone !== undefined) {
      // Check if phone already exists for another staff
      const phoneCheck = db.prepare("SELECT id FROM staff WHERE phone = ? AND id != ?").get(phone, id);
      if (phoneCheck) {
        return NextResponse.json(
          { error: "شماره تماس قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
      updateFields.push("phone = ?");
      updateValues.push(phone);
    }

    if (email !== undefined) {
      if (!email) {
        return NextResponse.json(
          { error: "ایمیل الزامی است" },
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
      // Check if email already exists for another staff
      const emailCheck = db.prepare("SELECT id FROM staff WHERE email = ? AND id != ?").get(email, id);
      if (emailCheck) {
        return NextResponse.json(
          { error: "ایمیل قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
      updateFields.push("email = ?");
      updateValues.push(email);
    }

    if (password !== undefined && password) {
      const passwordHash = await hashStaffPassword(password);
      updateFields.push("password_hash = ?");
      updateValues.push(passwordHash);
    }

    if (role !== undefined) {
      if (!["waiter", "barista", "manager"].includes(role)) {
        return NextResponse.json(
          { error: "نقش نامعتبر است" },
          { status: 400 }
        );
      }
      updateFields.push("role = ?");
      updateValues.push(role);
    }

    if (branch_id !== undefined) {
      updateFields.push("branch_id = ?");
      updateValues.push(branch_id || null);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push("updated_at = ?");
    updateValues.push(Math.floor(Date.now() / 1000));
    updateValues.push(id);

    db.prepare(`
      UPDATE staff
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updatedStaff = db.prepare(`
      SELECT s.*, b.name as branch_name
      FROM staff s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.id = ?
    `).get(id) as any;

    return NextResponse.json({
      ...updatedStaff,
      is_active: Boolean(updatedStaff.is_active),
      created_at: Number(updatedStaff.created_at),
      updated_at: Number(updatedStaff.updated_at),
      password_hash: undefined,
    });
  } catch (error) {
    console.error("Staff PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update staff" },
      { status: 500 }
    );
  }
}

// DELETE staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM staff WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // Delete all sessions first
    db.prepare("DELETE FROM staff_sessions WHERE staff_id = ?").run(id);
    
    // Delete staff
    db.prepare("DELETE FROM staff WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Staff DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete staff" },
      { status: 500 }
    );
  }
}

