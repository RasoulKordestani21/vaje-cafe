import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { v4 as uuidv4 } from "uuid";

// GET all branches
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const branches = db.prepare("SELECT * FROM branches ORDER BY createdAt DESC").all();
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

// POST create new branch
export async function POST(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const body = await request.json();
    const { name, address, phone, email, isActive = true } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام شعبه الزامی است" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO branches (id, name, address, phone, email, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), address?.trim() || null, phone?.trim() || null, email?.trim() || null, isActive ? 1 : 0, now, now);

    const branch = db.prepare("SELECT * FROM branches WHERE id = ?").get(id);
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}




