import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import { validateSession } from "@/lib/authMiddleware";
import crypto from "crypto";

// GET loyalty points history for customer (admin can view any customer, customers can only view their own)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const customerIdParam = searchParams.get("customer_id");

    // Check if admin
    const sessionAuth = validateSession(request);
    let isAdmin = false;
    if (sessionAuth.user && !sessionAuth.error) {
      const user = db.prepare("SELECT role FROM admin_users WHERE id = ?").get(sessionAuth.user.id) as any;
      isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    }

    let customerId: string | null = null;

    if (customerIdParam) {
      // If customer_id is provided, check if admin
      if (isAdmin) {
        customerId = customerIdParam; // Admin can view any customer
      } else {
        // Regular customer can only view their own
        const auth = await verifyCustomerAuth(request);
        if (auth.authenticated && auth.customer && auth.customer.id === customerIdParam) {
          customerId = customerIdParam;
        } else {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
      }
    } else {
      // No customer_id provided - check if customer auth
      const auth = await verifyCustomerAuth(request);
      if (!auth.authenticated || !auth.customer) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      customerId = auth.customer.id;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    const transactions = db.prepare(`
      SELECT * FROM loyalty_points
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(customerId, parseInt(limit)) as any[];

    const formattedTransactions = transactions.map(t => ({
      ...t,
      created_at: formatTimestamp(t.created_at),
    }));

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error("Loyalty points GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty points history" },
      { status: 500 }
    );
  }
}

// POST award points (admin only or automatic from order completion)
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { customer_id, points, order_id, description, transaction_type = "earned" } = body;

    if (!customer_id || !points) {
      return NextResponse.json(
        { error: "customer_id and points are required" },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(customer_id) as any;
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const transactionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Create transaction record
    db.prepare(`
      INSERT INTO loyalty_points (id, customer_id, points, transaction_type, order_id, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(transactionId, customer_id, points, transaction_type, order_id || null, description || null, now);

    // Update customer balance
    const currentBalance = customer.loyalty_points_balance || 0;
    let newBalance;
    
    if (transaction_type === "adjustment") {
      // For adjustments, points can be positive or negative
      newBalance = currentBalance + points;
    } else if (transaction_type === "earned") {
      newBalance = currentBalance + Math.abs(points);
    } else {
      // redeemed or expired
      newBalance = currentBalance - Math.abs(points);
    }
    
    // Ensure balance doesn't go negative (unless it's an adjustment)
    if (transaction_type !== "adjustment" && newBalance < 0) {
      newBalance = 0;
    }
    
    db.prepare(`
      UPDATE customers 
      SET loyalty_points_balance = ?,
          updatedAt = ?
      WHERE id = ?
    `).run(newBalance, now, customer_id);

    const transaction = db.prepare("SELECT * FROM loyalty_points WHERE id = ?").get(transactionId) as any;

    return NextResponse.json({
      ...transaction,
      created_at: formatTimestamp(transaction.created_at),
    }, { status: 201 });
  } catch (error) {
    console.error("Loyalty points POST error:", error);
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    );
  }
}

