import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import {
  awardLoyaltyPoints,
  LOYALTY_POINTS_EXPERIENCE_COMMENT,
  LOYALTY_POINTS_MENU_ITEM_COMMENT,
} from "@/lib/loyaltyService";

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

    const existing = db.prepare("SELECT * FROM experience_comments WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const wasApproved = Boolean(existing.admin_approved);

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

    // Award loyalty points on first approval (logged-in customers only)
    let loyaltyAward: { awarded: boolean; points?: number } = { awarded: false };
    if (
      admin_approved === true &&
      !wasApproved &&
      existing.customer_id
    ) {
      const isMenuComment = Boolean(existing.menu_item_id);
      const points = isMenuComment
        ? LOYALTY_POINTS_MENU_ITEM_COMMENT
        : LOYALTY_POINTS_EXPERIENCE_COMMENT;
      const sourceType = isMenuComment ? "menu_item_comment" : "experience_comment";
      let menuItemName = "";
      if (isMenuComment) {
        const mi = db
          .prepare("SELECT name FROM menu_items WHERE id = ?")
          .get(existing.menu_item_id) as { name?: string } | undefined;
        menuItemName = mi?.name || "";
      }
      const description = isMenuComment
        ? `امتیاز نظر منو${menuItemName ? `: ${menuItemName}` : ""}`
        : "امتیاز نظر تجربه مشتری";

      const result = awardLoyaltyPoints(db, {
        customerId: existing.customer_id,
        points,
        sourceType,
        sourceId: id,
        description,
      });
      loyaltyAward = { awarded: result.awarded, points: result.awarded ? points : undefined };
    }

    const updated = db.prepare("SELECT * FROM experience_comments WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...updated,
      rating: Number(updated.rating),
      admin_approved: Boolean(updated.admin_approved),
      created_at: formatTimestamp(updated.created_at),
      updated_at: formatTimestamp(updated.updated_at),
      loyalty_awarded: loyaltyAward,
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
