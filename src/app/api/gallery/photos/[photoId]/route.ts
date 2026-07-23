import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { deleteMediaByUrl } from "@/lib/imageService";

// PUT update photo (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { photoId } = await Promise.resolve(params);
    const body = await request.json();
    const { image_url, caption, display_order } = body;

    const existing = db.prepare("SELECT * FROM photos WHERE id = ?").get(photoId);
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

    updateValues.push(photoId);

    db.prepare(`
      UPDATE photos
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updated = db.prepare("SELECT * FROM photos WHERE id = ?").get(photoId) as any;

    return NextResponse.json({
      ...updated,
      createdAt: formatTimestamp(updated.created_at),
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
  { params }: { params: { photoId: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { photoId } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM photos WHERE id = ?").get(photoId) as
      | { image_url?: string }
      | undefined;
    if (!existing) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    if (existing.image_url) {
      deleteMediaByUrl(existing.image_url);
    }

    db.prepare("DELETE FROM photos WHERE id = ?").run(photoId);

    return NextResponse.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Photo DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}



