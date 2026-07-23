import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";

// GET all rewards (public - active only, or admin - all)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active_only") !== "false"; // Default true

    // Check if admin (for management)
    const auth = requireAdminAccess(request);
    const isAdmin = auth.authorized;

    let query = `
      SELECT * FROM loyalty_rewards
      WHERE 1=1
    `;
    const params: any[] = [];

    // Public users only see active rewards
    if (!isAdmin && activeOnly) {
      query += ` AND is_active = 1`;
    }

    query += ` ORDER BY display_order ASC, created_at DESC`;

    const rewards = db.prepare(query).all(...params) as any[];

    const formattedRewards = rewards.map(r => ({
      ...r,
      is_active: Boolean(r.is_active),
      created_at: formatTimestamp(r.created_at),
      updated_at: formatTimestamp(r.updated_at),
    }));

    return NextResponse.json({ rewards: formattedRewards });
  } catch (error) {
    console.error("Loyalty rewards GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

// POST create new reward (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const db = getDatabase();
    const body = await request.json();
    const {
      name,
      description,
      points_required,
      discount_percent,
      discount_amount,
      reward_type,
      display_order = 0
    } = body;

    if (!name || !points_required || !reward_type) {
      return NextResponse.json(
        { error: "name, points_required, and reward_type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["discount", "free_item", "cashback"];
    if (!validTypes.includes(reward_type)) {
      return NextResponse.json(
        { error: `reward_type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO loyalty_rewards (id, name, description, points_required, discount_percent, discount_amount, reward_type, is_active, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      description || null,
      points_required,
      discount_percent || null,
      discount_amount || null,
      reward_type,
      1, // is_active
      display_order,
      now,
      now
    );

    const reward = db.prepare("SELECT * FROM loyalty_rewards WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...reward,
      is_active: Boolean(reward.is_active),
      created_at: formatTimestamp(reward.created_at),
      updated_at: formatTimestamp(reward.updated_at),
    }, { status: 201 });
  } catch (error) {
    console.error("Loyalty reward POST error:", error);
    return NextResponse.json(
      { error: "Failed to create reward" },
      { status: 500 }
    );
  }
}



