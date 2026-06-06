import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import crypto from "crypto";

// POST redeem reward (customer only)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyCustomerAuth(request);
    
    if (!auth.authenticated || !auth.customer) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const body = await request.json();
    const { reward_id } = body;

    if (!reward_id) {
      return NextResponse.json(
        { error: "reward_id is required" },
        { status: 400 }
      );
    }

    // Get reward
    const reward = db.prepare("SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = 1").get(reward_id) as any;
    if (!reward) {
      return NextResponse.json(
        { error: "Reward not found or not available" },
        { status: 404 }
      );
    }

    // Get customer current balance
    const customer = db.prepare("SELECT loyalty_points_balance FROM customers WHERE id = ?").get(auth.customer.id) as any;
    const currentBalance = customer?.loyalty_points_balance || 0;

    if (currentBalance < reward.points_required) {
      return NextResponse.json(
        { error: `Insufficient points. You have ${currentBalance} points, but ${reward.points_required} points are required.` },
        { status: 400 }
      );
    }

    const transactionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const pointsToDeduct = reward.points_required;
    const newBalance = currentBalance - pointsToDeduct;

    // Create redemption transaction
    db.prepare(`
      INSERT INTO loyalty_points (id, customer_id, points, transaction_type, reward_id, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      transactionId,
      auth.customer.id,
      pointsToDeduct,
      "redeemed",
      reward_id,
      `Redeemed reward: ${reward.name}`,
      now
    );

    // Update customer balance
    db.prepare(`
      UPDATE customers 
      SET loyalty_points_balance = ?,
          updatedAt = ?
      WHERE id = ?
    `).run(newBalance, now, auth.customer.id);

    const transaction = db.prepare("SELECT * FROM loyalty_points WHERE id = ?").get(transactionId) as any;
    const updatedCustomer = db.prepare("SELECT loyalty_points_balance FROM customers WHERE id = ?").get(auth.customer.id) as any;

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        created_at: formatTimestamp(transaction.created_at),
      },
      reward: {
        ...reward,
        is_active: Boolean(reward.is_active),
      },
      new_balance: updatedCustomer.loyalty_points_balance
    }, { status: 200 });
  } catch (error) {
    console.error("Loyalty redeem POST error:", error);
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 }
    );
  }
}



