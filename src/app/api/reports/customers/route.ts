import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? parseInt(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? parseInt(searchParams.get("endDate")!) : undefined;

    const now = Math.floor(Date.now() / 1000);
    const start = startDate || now - 30 * 24 * 60 * 60;
    const end = endDate || now;

    // Get customer statistics
    const customerStats = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' AND o.createdAt BETWEEN ? AND ? THEN o.id ELSE NULL END) as ordersInPeriod,
        SUM(CASE WHEN o.status = 'completed' AND o.createdAt BETWEEN ? AND ? THEN o.totalPrice ELSE 0 END) as spentInPeriod,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id ELSE NULL END) as totalOrders,
        SUM(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE 0 END) as totalSpent,
        MAX(CASE WHEN o.status = 'completed' THEN o.createdAt ELSE NULL END) as lastOrderDate
      FROM customers c
      LEFT JOIN orders o ON o.customerId = c.id
      GROUP BY c.id
      HAVING ordersInPeriod > 0
      ORDER BY spentInPeriod DESC
    `).all(start, end, start, end) as any[];

    // Customer segments (based on total spent)
    const segments = {
      vip: customerStats.filter(c => (c.totalSpent || 0) >= 1000000).length, // 1M+ tomans
      regular: customerStats.filter(c => {
        const spent = c.totalSpent || 0;
        return spent >= 200000 && spent < 1000000;
      }).length,
      new: customerStats.filter(c => (c.totalSpent || 0) < 200000).length,
    };

    // New customers in period
    const newCustomers = db.prepare(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE createdAt BETWEEN ? AND ?
    `).get(start, end) as any;

    // Average order value by customer
    const avgOrderValue = customerStats.length > 0
      ? Math.round(customerStats.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / customerStats.reduce((sum, c) => sum + (c.totalOrders || 0), 1))
      : 0;

    // Top customers
    const topCustomers = customerStats
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 20);

    // Customer acquisition over time (daily)
    const acquisitionData = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', datetime(createdAt, 'unixepoch')) as date,
        COUNT(*) as newCustomers
      FROM customers
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date DESC
    `).all(start, end) as any[];

    // Loyalty points statistics
    const loyaltyStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT customer_id) as customersWithPoints,
        SUM(points) as totalPointsAwarded,
        SUM(CASE WHEN transaction_type = 'redeemed' THEN points ELSE 0 END) as totalPointsRedeemed
      FROM loyalty_points
      WHERE created_at BETWEEN ? AND ?
    `).get(start, end) as any;

    return NextResponse.json({
      customers: customerStats.map(c => ({
        ...c,
        ordersInPeriod: c.ordersInPeriod || 0,
        spentInPeriod: c.spentInPeriod || 0,
        totalOrders: c.totalOrders || 0,
        totalSpent: c.totalSpent || 0,
      })),
      segments,
      totals: {
        totalCustomers: customerStats.length,
        newCustomers: newCustomers?.count || 0,
        avgOrderValue,
        customersWithPoints: loyaltyStats?.customersWithPoints || 0,
        totalPointsAwarded: loyaltyStats?.totalPointsAwarded || 0,
        totalPointsRedeemed: loyaltyStats?.totalPointsRedeemed || 0,
      },
      topCustomers,
      acquisitionData,
    });
  } catch (error) {
    console.error("Customer report error:", error);
    return NextResponse.json(
      { error: "Failed to generate customer report" },
      { status: 500 }
    );
  }
}


