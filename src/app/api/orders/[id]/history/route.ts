import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { verifyStaffAuth } from "@/lib/staffAuthMiddleware";

// GET order status history (timeline)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if admin or staff
  const adminAuth = ensureAdmin(request);
  const staffAuth = await verifyStaffAuth(request);

  if (adminAuth && (!staffAuth.authenticated)) {
    return adminAuth;
  }

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    // Get order status history
    const history = db.prepare(`
      SELECT * FROM order_status_history 
      WHERE order_id = ? 
      ORDER BY created_at ASC
    `).all(id) as any[];

    const formattedHistory = history.map(h => ({
      ...h,
      createdAt: formatTimestamp(h.created_at),
    }));

    return NextResponse.json({ history: formattedHistory });
  } catch (error) {
    console.error("Order history GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order history" },
      { status: 500 }
    );
  }
}



