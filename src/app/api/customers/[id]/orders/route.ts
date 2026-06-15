import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import { validateSession } from "@/lib/authMiddleware";
import { ensureAdmin } from "@/lib/auth";

initializeDatabase();

function isAdminRequest(request: NextRequest): boolean {
  const sessionAuth = validateSession(request);
  if (sessionAuth.user && !sessionAuth.error) {
    const db = getDatabase();
    const user = db
      .prepare("SELECT role FROM admin_users WHERE id = ?")
      .get(sessionAuth.user.id) as { role?: string } | undefined;
    if (user && (user.role === "admin" || user.role === "super_admin")) {
      return true;
    }
  }
  return ensureAdmin(request) === null;
}

// GET customer orders by customer ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const isAdmin = isAdminRequest(request);

    if (!isAdmin) {
      const auth = await verifyCustomerAuth(request);
      if (!auth.authenticated || !auth.customer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (auth.customer.id !== customerId) {
        return NextResponse.json(
          { error: "Forbidden: Cannot access other customer's orders" },
          { status: 403 }
        );
      }
    }

    const db = getDatabase();
    const limit = isAdmin ? 50 : 10;

    const orders = db
      .prepare(
        `
      SELECT * FROM orders
      WHERE customerId = ?
         OR customerPhone = (SELECT phone FROM customers WHERE id = ?)
      ORDER BY createdAt DESC
      LIMIT ?
    `
      )
      .all(customerId, customerId, limit) as Array<Record<string, unknown>>;

    const ordersWithItems = orders.map(order => {
      const items = db
        .prepare(`SELECT * FROM order_items WHERE orderId = ?`)
        .all(order.id);

      return {
        ...order,
        items,
        total: order.totalPrice ?? order.totalAmount ?? 0,
        createdAt: formatTimestamp(order.createdAt as number),
        updatedAt: formatTimestamp(order.updatedAt as number)
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
