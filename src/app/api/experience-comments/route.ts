import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import { ensureAdmin } from "@/lib/auth";
import crypto from "crypto";

// GET all experience comments (public - approved only, or admin - all)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const approvedOnly = searchParams.get("approved_only") !== "false"; // Default true
    const menuItemId = searchParams.get("menu_item_id");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Check if admin (for moderation)
    const authHeader = request.headers.get("x-access-token");
    const isAdmin = authHeader && ensureAdmin(request) === null;

    let query = `
      SELECT ec.*, c.profilePicture as customer_profile_picture,
        mi.name as menu_item_name
      FROM experience_comments ec
      LEFT JOIN customers c ON ec.customer_id = c.id
      LEFT JOIN menu_items mi ON ec.menu_item_id = mi.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (menuItemId) {
      query += ` AND ec.menu_item_id = ?`;
      params.push(menuItemId);
    } else if (!isAdmin && approvedOnly) {
      // Public experience page: only general experience comments (not menu-item ones)
      query += ` AND ec.menu_item_id IS NULL`;
    }

    // Public users only see approved comments
    if (!isAdmin && approvedOnly) {
      query += ` AND admin_approved = 1`;
    }

    query += ` ORDER BY created_at DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }

    const comments = db.prepare(query).all(...params) as any[];

    const formattedComments = comments.map(c => ({
      ...c,
      rating: Number(c.rating),
      admin_approved: Boolean(c.admin_approved),
      createdAt: Number(c.created_at),
      created_at: formatTimestamp(c.created_at),
      updated_at: formatTimestamp(c.updated_at),
      customer_profile_picture: c.customer_profile_picture || null,
      menu_item_name: c.menu_item_name || null,
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error("Experience comments GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST create new experience comment
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { comment_text, rating, customer_name, customer_phone, menu_item_id } = body;

    if (!comment_text || !rating) {
      return NextResponse.json(
        { error: "متن نظر و امتیاز الزامی است" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "امتیاز باید بین 1 تا 5 باشد" },
        { status: 400 }
      );
    }

    // Try to get customer from auth (optional - can be anonymous)
    let customerId = null;
    try {
      const auth = await verifyCustomerAuth(request);
      if (auth.authenticated && auth.customer) {
        customerId = auth.customer.id;
      }
    } catch (e) {
      // Allow anonymous comments
    }

    if (menu_item_id) {
      const menuItem = db.prepare("SELECT id FROM menu_items WHERE id = ?").get(menu_item_id);
      if (!menuItem) {
        return NextResponse.json({ error: "آیتم منو یافت نشد" }, { status: 404 });
      }
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO experience_comments (id, customer_id, comment_text, rating, admin_approved, customer_name, customer_phone, menu_item_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      customerId,
      comment_text,
      rating,
      0, // Requires admin approval
      customer_name || null,
      customer_phone || null,
      menu_item_id || null,
      now,
      now
    );

    const newComment = db.prepare("SELECT * FROM experience_comments WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...newComment,
      rating: Number(newComment.rating),
      admin_approved: Boolean(newComment.admin_approved),
      created_at: formatTimestamp(newComment.created_at),
      updated_at: formatTimestamp(newComment.updated_at),
    }, { status: 201 });
  } catch (error) {
    console.error("Experience comment POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 }
    );
  }
}

