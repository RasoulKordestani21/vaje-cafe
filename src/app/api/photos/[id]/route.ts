import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";

// PUT update photo (admin only)
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
    const { image_url, caption, display_order } = body;

    const existing = db.prepare("SELECT * FROM photos WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (image_url !== undefined) {
      updateFields.push("image_url = ?");
      updateValues.push(image_url);
    }

    if (caption !== undefined) {
      updateFields.push("caption = ?");
      updateValues.push(caption || null);
    }

    if (display_order !== undefined) {
      updateFields.push("display_order = ?");
      updateValues.push(display_order);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateValues.push(id);

    db.prepare(`
      UPDATE photos
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updated = db.prepare("SELECT * FROM photos WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...updated,
      created_at: Number(updated.created_at),
    });
  } catch (error) {
    console.error("Photo PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

// DELETE photo (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM photos WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    db.prepare("DELETE FROM photos WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Photo DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}

