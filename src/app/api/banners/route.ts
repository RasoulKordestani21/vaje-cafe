import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

// GET all banners (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const type = searchParams.get("type");

    let query = "SELECT * FROM banners";
    const conditions: string[] = [];
    const params: any[] = [];

    if (activeOnly) {
      conditions.push("is_active = 1");
      const now = Math.floor(Date.now() / 1000);
      conditions.push("(start_date IS NULL OR start_date <= ?)");
      conditions.push("(end_date IS NULL OR end_date >= ?)");
      params.push(now, now);
    }

    if (type) {
      conditions.push("type = ?");
      params.push(type);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY priority DESC, createdAt DESC";

    const banners = db.prepare(query).all(...params);

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Banners GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// POST create new banner
export async function POST(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin can create banners
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      image_url,
      link_url,
      type = "promotion",
      start_date,
      end_date,
      is_active = true,
      priority = 0
    } = body;

    if (!title || !image_url) {
      return NextResponse.json(
        { error: "عنوان و تصویر الزامی است" },
        { status: 400 }
      );
    }

    if (!["promotion", "offer", "notification", "special_day"].includes(type)) {
      return NextResponse.json(
        { error: "نوع بنر نامعتبر است" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const bannerId = uuidv4();

    // Convert dates to timestamps if provided as ISO strings
    const startTimestamp = start_date ? (typeof start_date === "string" ? Math.floor(new Date(start_date).getTime() / 1000) : start_date) : null;
    const endTimestamp = end_date ? (typeof end_date === "string" ? Math.floor(new Date(end_date).getTime() / 1000) : end_date) : null;

    db.prepare(`
      INSERT INTO banners (id, title, image_url, link_url, type, start_date, end_date, is_active, priority, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bannerId,
      title,
      image_url,
      link_url || null,
      type,
      startTimestamp,
      endTimestamp,
      is_active ? 1 : 0,
      priority,
      now,
      now
    );

    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(bannerId);

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error("Banners POST error:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

