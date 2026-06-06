import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";

// GET customer's own messages
export async function GET(request: NextRequest) {
  const auth = await verifyCustomerAuth(request);
  if (!auth.authenticated || !auth.customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const messages = db.prepare(`
      SELECT * FROM customer_messages
      WHERE customer_id = ?
      ORDER BY createdAt DESC
    `).all(auth.customer.id);

    const formattedMessages = (messages as any[]).map(msg => ({
      ...msg,
      admin_read: Boolean(msg.admin_read),
      admin_replied: Boolean(msg.admin_replied),
      createdAt: Number(msg.createdAt),
      updatedAt: Number(msg.updatedAt),
    }));

    // Group messages by subject (ticket system)
    const tickets: { [key: string]: any[] } = {};
    formattedMessages.forEach(msg => {
      const ticketKey = msg.subject || "بدون موضوع";
      if (!tickets[ticketKey]) {
        tickets[ticketKey] = [];
      }
      tickets[ticketKey].push(msg);
    });

    // Convert to array and sort by latest message date
    const ticketList = Object.entries(tickets).map(([subject, msgs]) => ({
      subject,
      messages: msgs.sort((a, b) => b.createdAt - a.createdAt),
      latestMessage: msgs[0],
      unreadCount: msgs.filter(m => !m.admin_read).length,
      hasReply: msgs.some(m => m.admin_replied),
    })).sort((a, b) => b.latestMessage.createdAt - a.latestMessage.createdAt);

    return NextResponse.json({ tickets: ticketList, messages: formattedMessages });
  } catch (error) {
    console.error("Customer messages GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}



