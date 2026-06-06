import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";

// PUT update comment (admin only - for approval/rejection)
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
    const { admin_approved, comment_text } = body;

    const existing = db.prepare("SELECT * FROM experience_comments WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (admin_approved !== undefined) {
      updateFields.push("admin_approved = ?");
      updateValues.push(admin_approved ? 1 : 0);
    }

    if (comment_text !== undefined) {
      updateFields.push("comment_text = ?");
      updateValues.push(comment_text);
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
      UPDATE experience_comments
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updated = db.prepare("SELECT * FROM experience_comments WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...updated,
      rating: Number(updated.rating),
      admin_approved: Boolean(updated.admin_approved),
      created_at: formatTimestamp(updated.created_at),
      updated_at: formatTimestamp(updated.updated_at),
    });
  } catch (error) {
    console.error("Experience comment PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE comment (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM experience_comments WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    db.prepare("DELETE FROM experience_comments WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Experience comment DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}



