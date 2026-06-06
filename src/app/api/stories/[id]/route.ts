import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { compressAndSaveImage, validateImage } from "@/lib/imageService";

// PUT update story (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const formData = await request.formData();
    
    const caption = formData.get("caption") as string;
    const duration = formData.get("duration") as string;
    const display_order = formData.get("display_order") as string;
    const is_active = formData.get("is_active") as string;
    const expires_at = formData.get("expires_at") as string;
    const imageFile = formData.get("image") as File | null;

    const existing = db.prepare("SELECT * FROM stories WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (caption !== undefined) {
      updateFields.push("caption = ?");
      updateValues.push(caption || null);
    }

    if (duration !== undefined) {
      updateFields.push("duration = ?");
      updateValues.push(parseInt(duration) || 20);
    }

    if (display_order !== undefined) {
      updateFields.push("display_order = ?");
      updateValues.push(parseInt(display_order) || 0);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active === "true" ? 1 : 0);
    }

    if (expires_at !== undefined) {
      updateFields.push("expires_at = ?");
      updateValues.push(expires_at ? parseInt(expires_at) : null);
    }

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      validateImage(buffer, imageFile.type);
      const { url: image_url } = await compressAndSaveImage(buffer, imageFile.name, {
        width: 1080,
        height: 1920,
        quality: 85
      });
      updateFields.push("image_url = ?");
      updateValues.push(image_url);
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
      UPDATE stories
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updated = db.prepare("SELECT * FROM stories WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...updated,
      is_active: Boolean(updated.is_active),
      created_at: formatTimestamp(updated.created_at),
      updated_at: formatTimestamp(updated.updated_at),
      expires_at: updated.expires_at ? formatTimestamp(updated.expires_at) : null,
    });
  } catch (error) {
    console.error("Story PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE story (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM stories WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    db.prepare("DELETE FROM stories WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    console.error("Story DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}



