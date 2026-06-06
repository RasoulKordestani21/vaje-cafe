import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";

initializeDatabase();

// GET customer orders by customer ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify customer authentication
    const auth = await verifyCustomerAuth(request);
    if (!auth.authenticated || !auth.customer) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ensure customer can only access their own orders
    const customerId = params.id;
    if (auth.customer.id !== customerId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot access other customer's orders" },
        { status: 403 }
      );
    }

    const db = getDatabase();
    
    // Get customer orders (limit to last 10, ordered by most recent)
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE customerId = ? 
      ORDER BY createdAt DESC 
      LIMIT 10
    `).all(customerId) as any[];

    // Get order items for each order
    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT * FROM order_items WHERE orderId = ?
      `).all(order.id);

      return {
        ...order,
        items,
        createdAt: formatTimestamp(order.createdAt),
        updatedAt: formatTimestamp(order.updatedAt)
      };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Customer orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer orders" },
      { status: 500 }
    );
  }
}
