import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureStaff } from "@/lib/staffAuthMiddleware";
import { deductInventoryForOrder } from "@/services/productsService";

// PATCH update order status (for barista, manager, and waiter)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Barista, manager, and waiter can update order status (with restrictions)
  const authErr = ensureStaff(request, ["barista", "manager", "waiter"]);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Get staff info for notification
    const token = request.cookies.get("staff_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getStaffByToken } = await import("@/lib/staffAuth");
    const staff = getStaffByToken(token);
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based status restrictions
    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Baristas can only change to preparing or ready
    if (staff.role === "barista") {
      if (!["preparing", "ready"].includes(status)) {
        return NextResponse.json(
          { error: "Baristas can only set status to 'preparing' or 'ready'" },
          { status: 403 }
        );
      }
    }

    // Check if order exists
    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order status
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?
    `);

    stmt.run(status, now, id);

    // If order is being completed, decrease inventory (only managers can complete)
    if (
      status === "completed" &&
      staff.role === "manager" &&
      existing.status !== "completed"
    ) {
      const deduction = deductInventoryForOrder(id);
      if (deduction.productsDeducted === 0) {
        console.warn(
          `[Inventory] Order ${id} completed but no stock was deducted. ` +
            `Items missing ingredients: ${deduction.itemsWithoutIngredients.join(", ") || "none"}`
        );
      }
    }

    // Create notification for waiters when barista sets order to 'ready'
    if (status === "ready" && staff.role === "barista") {
      const { randomUUID } = await import("crypto");
      const notificationId = randomUUID();
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
      
      db.prepare(`
        INSERT INTO staff_notifications (id, order_id, staff_role, message, created_at, read)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(
        notificationId,
        id,
        "waiter",
        `سفارش #${id.substring(0, 8)} آماده تحویل است${order.tableNumber ? ` - میز ${order.tableNumber}` : ""}`,
        now
      );
    }

    // Get updated order with items
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
    const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...order,
      items,
      createdAt: Number(order.createdAt),
      updatedAt: Number(order.updatedAt),
    });
  } catch (error) {
    console.error("Staff order PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
