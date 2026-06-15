import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { buildLoyaltySummary } from "@/lib/loyaltyService";
import crypto from "crypto";

const LOYALTY_TX_QUERY = `
  SELECT lp.*,
    lr.name as reward_name,
    lr.reward_type,
    lr.discount_percent,
    lr.discount_amount,
    o.totalPrice as order_total,
    ec.comment_text as experience_comment_text,
    ec.menu_item_id as experience_menu_item_id,
    mi_ec.name as experience_menu_item_name,
    rt.rating as menu_rating_value,
    rt.review_text as menu_review_text,
    mi_rt.name as menu_item_name
  FROM loyalty_points lp
  LEFT JOIN loyalty_rewards lr ON lp.reward_id = lr.id
  LEFT JOIN orders o ON lp.order_id = o.id
  LEFT JOIN experience_comments ec
    ON lp.source_type IN ('experience_comment', 'menu_item_comment') AND lp.source_id = ec.id
  LEFT JOIN menu_items mi_ec ON ec.menu_item_id = mi_ec.id
  LEFT JOIN ratings rt ON lp.source_type = 'menu_rating' AND lp.source_id = rt.id
  LEFT JOIN menu_items mi_rt ON rt.menu_item_id = mi_rt.id
`;

function formatLoyaltyTransaction(t: any) {
  return {
    ...t,
    created_at: formatTimestamp(t.created_at),
    menu_rating_value: t.menu_rating_value != null ? Number(t.menu_rating_value) : null,
    order_total: t.order_total != null ? Number(t.order_total) : null,
  };
}

// GET loyalty points history for customer (admin can view any customer, customers can only view their own)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const customerIdParam = searchParams.get("customer_id");
    const includeSummary = searchParams.get("summary") !== "false";

    let customerId: string | null = null;

    if (customerIdParam) {
      const adminAuth = requireAdminAccess(request);
      if (adminAuth.authorized) {
        customerId = customerIdParam;
      } else {
        const auth = await verifyCustomerAuth(request);
        if (auth.authenticated && auth.customer && auth.customer.id === customerIdParam) {
          customerId = customerIdParam;
        } else {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    } else {
      const auth = await verifyCustomerAuth(request);
      if (!auth.authenticated || !auth.customer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      customerId = auth.customer.id;
    }

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 });
    }

    const transactions = db
      .prepare(
        `${LOYALTY_TX_QUERY}
         WHERE lp.customer_id = ?
         ORDER BY lp.created_at DESC
         LIMIT ?`
      )
      .all(customerId, parseInt(limit)) as any[];

    const formattedTransactions = transactions.map(formatLoyaltyTransaction);

    const response: Record<string, unknown> = { transactions: formattedTransactions };

    if (includeSummary) {
      const allForSummary = db
        .prepare(
          `${LOYALTY_TX_QUERY}
           WHERE lp.customer_id = ?
           ORDER BY lp.created_at DESC`
        )
        .all(customerId) as any[];
      response.summary = buildLoyaltySummary(allForSummary.map(formatLoyaltyTransaction));
    }

    return NextResponse.json(response);
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
    const {
      customer_id,
      points,
      order_id,
      description,
      transaction_type = "earned",
      source_type = "manual",
      source_id,
    } = body;

    if (!customer_id || !points) {
      return NextResponse.json(
        { error: "customer_id and points are required" },
        { status: 400 }
      );
    }

    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(customer_id) as any;
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const transactionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const resolvedSourceId = source_id || order_id || transactionId;

    db.prepare(
      `INSERT INTO loyalty_points
         (id, customer_id, points, transaction_type, order_id, source_type, source_id, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      transactionId,
      customer_id,
      Math.abs(points),
      transaction_type,
      order_id || null,
      source_type,
      resolvedSourceId,
      description || null,
      now
    );

    const currentBalance = customer.loyalty_points_balance || 0;
    let newBalance;

    if (transaction_type === "adjustment") {
      newBalance = currentBalance + points;
    } else if (transaction_type === "earned") {
      newBalance = currentBalance + Math.abs(points);
    } else {
      newBalance = currentBalance - Math.abs(points);
    }

    if (transaction_type !== "adjustment" && newBalance < 0) {
      newBalance = 0;
    }

    db.prepare(
      `UPDATE customers SET loyalty_points_balance = ?, updatedAt = ? WHERE id = ?`
    ).run(newBalance, now, customer_id);

    const transaction = db.prepare("SELECT * FROM loyalty_points WHERE id = ?").get(transactionId) as any;

    return NextResponse.json(
      {
        ...transaction,
        created_at: formatTimestamp(transaction.created_at),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Loyalty points POST error:", error);
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    );
  }
}
