import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyStaffAuth } from "@/lib/staffAuthMiddleware";

// GET orders for staff (role-based filtering)
export async function GET(request: NextRequest) {
  const staffAuth = await verifyStaffAuth(request);
  
  if (!staffAuth.authenticated || !staffAuth.staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const role = staffAuth.staff.role;
    
    // Check if staff has permission to view orders
    const permission = db.prepare(`
      SELECT enabled FROM staff_role_permissions 
      WHERE role = ? AND permission_key = 'view_orders'
    `).get(role) as any;
    
    if (!permission || !permission.enabled) {
      return NextResponse.json(
        { error: "Insufficient permissions to view orders" },
        { status: 403 }
      );
    }

    // Get orders based on role
    let query = "SELECT * FROM orders";
    const params: any[] = [];
    
    if (role === "waiter") {
      // Waiters only see ready orders
      query += " WHERE status = ?";
      params.push("ready");
    } else if (role === "barista") {
      // Baristas see new customer orders and in-progress kitchen orders
      query += " WHERE status IN (?, ?, ?)";
      params.push("pending", "preparing", "ready");
    } else if (role === "manager") {
      // Managers see all orders
      // No filter
    }

    query += " ORDER BY createdAt DESC LIMIT 100";

    const orders = db.prepare(query).all(...params) as any[];

    const formattedOrders = orders.map(order => {
      const items = db
        .prepare("SELECT * FROM order_items WHERE orderId = ?")
        .all(order.id);

      return {
        ...order,
        items,
        createdAt: formatTimestamp(order.createdAt),
        updatedAt: formatTimestamp(order.updatedAt),
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Staff orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
