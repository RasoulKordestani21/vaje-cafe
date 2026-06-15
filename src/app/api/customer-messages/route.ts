import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import { requireAdminAccess } from "@/lib/adminApiAuth";

// GET all customer messages (admin only)
export async function GET(request: NextRequest) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";

    let query = `
      SELECT m.*,
        COALESCE(c.name, m.customer_name) as customer_name,
        COALESCE(c.phone, m.customer_phone) as customer_phone,
        c.email as customer_email,
        c.profilePicture as customer_profile_picture,
        c.totalOrders as customer_total_orders,
        c.totalSpent as customer_total_spent,
        c.loyalty_points_balance as customer_loyalty_points
      FROM customer_messages m
      LEFT JOIN customers c ON m.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (unreadOnly) {
      query += ` AND m.admin_read = 0`;
    }

    query += ` ORDER BY m.createdAt DESC`;

    const messages = db.prepare(query).all(...params);

    const formattedMessages = (messages as any[]).map(msg => ({
      ...msg,
      admin_read: Boolean(msg.admin_read),
      admin_replied: Boolean(msg.admin_replied),
      createdAt: Number(msg.createdAt),
      updatedAt: Number(msg.updatedAt),
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Customer messages GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer messages" },
      { status: 500 }
    );
  }
}

// POST new customer message
export async function POST(request: NextRequest) {
  // Require customer authentication
  const auth = await verifyCustomerAuth(request);
  if (!auth.authenticated || !auth.customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const body = await request.json();
    const { subject, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "پیام الزامی است" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO customer_messages (id, customer_id, customer_name, customer_phone, subject, message, admin_read, admin_replied, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      auth.customer.id,
      auth.customer.name || null,
      auth.customer.phoneNumber || null,
      subject || null,
      message.trim(),
      0, // admin_read
      0, // admin_replied
      now,
      now
    );

    const newMessage = db.prepare("SELECT * FROM customer_messages WHERE id = ?").get(id) as any;

    return NextResponse.json(
      {
        ...newMessage,
        admin_read: Boolean(newMessage.admin_read),
        admin_replied: Boolean(newMessage.admin_replied),
        createdAt: Number(newMessage.createdAt),
        updatedAt: Number(newMessage.updatedAt),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Customer message POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create message" },
      { status: 500 }
    );
  }
}



