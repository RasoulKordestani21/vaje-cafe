import { NextRequest, NextResponse } from "next/server";
import {
  initializeDatabase,
  getDatabase,
  formatTimestamp
} from "@/lib/database";
import { v4 as uuidv4 } from "uuid";
import { ensureAdmin } from "@/lib/auth";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import { validateOrderItemsInventory } from "@/services/productsService";

initializeDatabase();

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const status = request.nextUrl.searchParams.get("status");

    let query = "SELECT * FROM orders";
    const params: any[] = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY createdAt DESC";

    const orders = db.prepare(query).all(...params);

    const formattedOrders = (orders as any[]).map(order => {
      // Get items for this order
      const items = db
        .prepare(
          `
        SELECT * FROM order_items WHERE orderId = ?
      `
        )
        .all(order.id);

      return {
        ...order,
        items,
        createdAt: formatTimestamp(order.createdAt),
        updatedAt: formatTimestamp(order.updatedAt)
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST new order
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    console.log(request);
    console.log(body);

    const orderId = uuidv4();
    const {
      tableNumber,
      items,
      note,
      source = "website",
      total,
      customerName,
      customerPhone,
      customerEmail
    } = body;

    // Manual orders require admin auth
    if (source === "manual") {
      const authErr = ensureAdmin(request);
      if (authErr) return authErr;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const inventoryCheck = validateOrderItemsInventory(items);
    if (!inventoryCheck.valid) {
      return NextResponse.json(
        {
          error: "عدم موجودی",
          unavailableItems: inventoryCheck.unavailableItems,
        },
        { status: 409 }
      );
    }

    // Use provided total or calculate
    const totalPrice =
      total ||
      items.reduce((sum: number, item: any) => {
        return sum + item.price * item.quantity;
      }, 0);

    // Find or create customer
    let customerId: string | null = null;
    const now = Math.floor(Date.now() / 1000);
    
    // First, try to get customer from session (for logged-in customers)
    if (source === "website") {
      try {
        const auth = await verifyCustomerAuth(request);
        if (auth.authenticated && auth.customer) {
          customerId = auth.customer.id;
          // Update customer stats
          db.prepare(`
            UPDATE customers 
            SET totalOrders = totalOrders + 1,
                totalSpent = totalSpent + ?,
                lastOrderDate = ?,
                updatedAt = ?
            WHERE id = ?
          `).run(totalPrice, now, now, customerId);
        }
      } catch (e) {
        console.warn("Could not verify customer auth:", e);
      }
    }
    
    // If no customer from session, try to find/create by provided info
    if (!customerId && customerName && customerName.trim() !== "") {
      // Try to find existing customer by phone (most reliable) or name
      let existingCustomer: any = null;
      
      if (customerPhone && customerPhone.trim() !== "") {
        existingCustomer = db
          .prepare("SELECT * FROM customers WHERE phone = ?")
          .get(customerPhone.trim()) as any;
      }
      
      // If not found by phone, try by name (less reliable but better than nothing)
      if (!existingCustomer) {
        existingCustomer = db
          .prepare("SELECT * FROM customers WHERE name = ? AND (phone IS NULL OR phone = '')")
          .get(customerName.trim()) as any;
      }

      if (existingCustomer) {
        // Update existing customer
        customerId = existingCustomer.id;
        db.prepare(`
          UPDATE customers 
          SET totalOrders = totalOrders + 1,
              totalSpent = totalSpent + ?,
              lastOrderDate = ?,
              updatedAt = ?,
              phone = COALESCE(?, phone),
              email = COALESCE(?, email)
          WHERE id = ?
        `).run(totalPrice, now, now, customerPhone || null, customerEmail || null, customerId);
      } else {
        // Create new customer
        customerId = uuidv4();
        db.prepare(`
          INSERT INTO customers (id, name, phone, email, totalOrders, totalSpent, lastOrderDate, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
        `).run(
          customerId,
          customerName.trim(),
          customerPhone?.trim() || null,
          customerEmail?.trim() || null,
          totalPrice,
          now,
          now,
          now
        );
      }
    }

    // Insert order with source field and customer info
    const orderStmt = db.prepare(`
      INSERT INTO orders (id, tableNumber, status, totalPrice, note, source, customerName, customerPhone, customerId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    orderStmt.run(
      orderId,
      tableNumber || null,
      "pending",
      totalPrice,
      note || "",
      source,
      customerName || "نام معرفی نشده",
      customerPhone || null,
      customerId,
      now,
      now
    );

    // Record initial status in history
    const { randomUUID } = await import("crypto");
    const historyId = randomUUID();
    db.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by_type, changed_by_id, changed_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(historyId, orderId, "pending", "system", null, null, now);

    // Insert order items
    const itemStmt = db.prepare(`
      INSERT INTO order_items (id, orderId, menuItemId, name, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item: any) => {
      itemStmt.run(
        uuidv4(),
        orderId,
        item.menuItemId,
        item.name,
        item.price,
        item.quantity
      );
    });

    // Update statistics
    const statsStmt = db.prepare(`
      UPDATE statistics SET ordersCount = ordersCount + 1, totalSales = totalSales + ?
    `);
    statsStmt.run(totalPrice);

    // Get created order
    const order = db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId) as any;
    const orderItems = db
      .prepare("SELECT * FROM order_items WHERE orderId = ?")
      .all(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...order,
        items: orderItems,
        createdAt: formatTimestamp(order.createdAt),
        updatedAt: formatTimestamp(order.updatedAt)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create order"
      },
      { status: 500 }
    );
  }
}
