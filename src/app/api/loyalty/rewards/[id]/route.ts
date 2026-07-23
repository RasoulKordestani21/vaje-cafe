import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import crypto from "crypto";

// PUT update reward (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    
    const {
      name,
      description,
      points_required,
      discount_percent,
      discount_amount,
      reward_type,
      is_active,
      display_order
    } = body;

    // Check if reward exists
    const existing = db.prepare("SELECT * FROM loyalty_rewards WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // Update reward
    db.prepare(`
      UPDATE loyalty_rewards 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          points_required = COALESCE(?, points_required),
          discount_percent = COALESCE(?, discount_percent),
          discount_amount = COALESCE(?, discount_amount),
          reward_type = COALESCE(?, reward_type),
          is_active = COALESCE(?, is_active),
          display_order = COALESCE(?, display_order),
          updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      description !== undefined ? description : null,
      points_required || null,
      discount_percent || null,
      discount_amount || null,
      reward_type || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      display_order !== undefined ? display_order : null,
      now,
      id
    );

    const reward = db.prepare("SELECT * FROM loyalty_rewards WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...reward,
      is_active: Boolean(reward.is_active),
      created_at: formatTimestamp(reward.created_at),
      updated_at: formatTimestamp(reward.updated_at),
    });
  } catch (error) {
    console.error("Loyalty reward PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update reward" },
      { status: 500 }
    );
  }
}

// DELETE reward (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    // Check if reward exists
    const existing = db.prepare("SELECT * FROM loyalty_rewards WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    // Delete reward
    db.prepare("DELETE FROM loyalty_rewards WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Loyalty reward DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete reward" },
      { status: 500 }
    );
  }
}


