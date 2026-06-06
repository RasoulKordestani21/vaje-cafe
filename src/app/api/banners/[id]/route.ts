import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";

initializeDatabase();

// GET single banner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(params.id) as any;

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}

// PUT update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin can update banners
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
      type,
      start_date,
      end_date,
      is_active,
      priority
    } = body;

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Check if banner exists
    const existing = db.prepare("SELECT id FROM banners WHERE id = ?").get(params.id) as { id: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url);
    }
    if (link_url !== undefined) {
      updates.push("link_url = ?");
      values.push(link_url);
    }
    if (type !== undefined) {
      if (!["promotion", "offer", "notification", "special_day"].includes(type)) {
        return NextResponse.json(
          { error: "نوع بنر نامعتبر است" },
          { status: 400 }
        );
      }
      updates.push("type = ?");
      values.push(type);
    }
    if (start_date !== undefined) {
      const startTimestamp = start_date ? (typeof start_date === "string" ? Math.floor(new Date(start_date).getTime() / 1000) : start_date) : null;
      updates.push("start_date = ?");
      values.push(startTimestamp);
    }
    if (end_date !== undefined) {
      const endTimestamp = end_date ? (typeof end_date === "string" ? Math.floor(new Date(end_date).getTime() / 1000) : end_date) : null;
      updates.push("end_date = ?");
      values.push(endTimestamp);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      values.push(priority);
    }

    updates.push("updatedAt = ?");
    values.push(now);
    values.push(params.id);

    db.prepare(`
      UPDATE banners 
      SET ${updates.join(", ")}
      WHERE id = ?
    `).run(...values);

    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(params.id);

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Banner PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin can delete banners
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

    const db = getDatabase();
    const existing = db.prepare("SELECT id FROM banners WHERE id = ?").get(params.id) as { id: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM banners WHERE id = ?").run(params.id);

    return NextResponse.json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Banner DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}

