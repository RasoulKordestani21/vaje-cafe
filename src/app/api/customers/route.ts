import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { validateSession } from "@/lib/authMiddleware";

initializeDatabase();

// GET all customers
export async function GET(request: NextRequest) {
  try {
    console.log("[Customers API] Checking authentication...");
    
    // Check admin via session (cookie-based auth)
    const sessionAuth = validateSession(request);
    let isAdmin = false;
    
    console.log("[Customers API] Session auth result:", { 
      hasUser: !!sessionAuth.user, 
      hasError: !!sessionAuth.error,
      userId: sessionAuth.user?.id 
    });
    
    if (sessionAuth.user && !sessionAuth.error) {
      const db = getDatabase();
      const user = db.prepare("SELECT role FROM admin_users WHERE id = ?").get(sessionAuth.user.id) as any;
      isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
      console.log("[Customers API] Session auth - isAdmin:", isAdmin, "role:", user?.role);
    }
    
    // Check admin via token (x-access-token header) - only if session auth didn't work
    if (!isAdmin) {
      const tokenAuthError = ensureAdmin(request);
      isAdmin = tokenAuthError === null;
      console.log("[Customers API] Token auth - isAdmin:", isAdmin);
    }

    if (!isAdmin) {
      console.log("[Customers API] Authentication failed - returning 401");
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    console.log("[Customers API] Authentication successful, fetching customers...");
    const db = getDatabase();
    const customers = db.prepare(`
      SELECT 
        c.*,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END), 0) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE 0 END), 0) as totalSpent,
        MAX(CASE WHEN o.status = 'completed' THEN o.createdAt ELSE NULL END) as lastOrderDate,
        (SELECT COALESCE(SUM(lp.points), 0) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'earned') as loyalty_points_earned,
        (SELECT COALESCE(SUM(lp.points), 0) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'redeemed') as loyalty_points_redeemed,
        (SELECT COUNT(*) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'redeemed') as loyalty_redemption_count,
        (SELECT COUNT(*) FROM loyalty_points lp WHERE lp.customer_id = c.id) as loyalty_transaction_count,
        (SELECT COALESCE(SUM(lp.points), 0) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'earned' AND (lp.source_type = 'order' OR (lp.source_type IS NULL AND lp.order_id IS NOT NULL))) as loyalty_earned_orders,
        (SELECT COALESCE(SUM(lp.points), 0) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'earned' AND lp.source_type = 'experience_comment') as loyalty_earned_experience,
        (SELECT COALESCE(SUM(lp.points), 0) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'earned' AND lp.source_type = 'menu_item_comment') as loyalty_earned_menu_comments,
        (SELECT COALESCE(SUM(lp.points), 0) FROM loyalty_points lp WHERE lp.customer_id = c.id AND lp.transaction_type = 'earned' AND lp.source_type = 'menu_rating') as loyalty_earned_menu_ratings,
        (SELECT GROUP_CONCAT(DISTINCT lr.reward_type) FROM loyalty_points lp JOIN loyalty_rewards lr ON lp.reward_id = lr.id WHERE lp.customer_id = c.id AND lp.transaction_type = 'redeemed') as loyalty_redeemed_types
      FROM customers c
      LEFT JOIN orders o ON o.customerId = c.id
      GROUP BY c.id
      ORDER BY c.createdAt DESC
    `).all() as any[];

    console.log("[Customers API] Found", customers.length, "customers");

    // Format the response
    const formattedCustomers = customers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      profilePicture: c.profilePicture || null,
      loyalty_points_balance: c.loyalty_points_balance || 0,
      loyalty_points_earned: c.loyalty_points_earned || 0,
      loyalty_points_redeemed: c.loyalty_points_redeemed || 0,
      loyalty_redemption_count: c.loyalty_redemption_count || 0,
      loyalty_transaction_count: c.loyalty_transaction_count || 0,
      loyalty_earned_orders: c.loyalty_earned_orders || 0,
      loyalty_earned_experience: c.loyalty_earned_experience || 0,
      loyalty_earned_menu_comments: c.loyalty_earned_menu_comments || 0,
      loyalty_earned_menu_ratings: c.loyalty_earned_menu_ratings || 0,
      loyalty_redeemed_types: c.loyalty_redeemed_types
        ? String(c.loyalty_redeemed_types).split(",").filter(Boolean)
        : [],
      has_used_loyalty: (c.loyalty_transaction_count || 0) > 0,
      has_redeemed_loyalty: (c.loyalty_redemption_count || 0) > 0,
      totalOrders: c.totalOrders || 0,
      totalSpent: c.totalSpent || 0,
      lastOrderDate: c.lastOrderDate || null,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    console.error("[Customers API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
