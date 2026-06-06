import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can access reports
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? parseInt(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? parseInt(searchParams.get("endDate")!) : undefined;
    const status = searchParams.get("status") || "completed"; // Default to completed orders
    const source = searchParams.get("source"); // Optional filter by source (website, manual, etc.)

    const now = Math.floor(Date.now() / 1000);
    const start = startDate || now - 30 * 24 * 60 * 60; // Default to last 30 days
    const end = endDate || now;

    // Build query
    let query = `
      SELECT 
        o.*,
        COUNT(DISTINCT oi.id) as itemCount,
        GROUP_CONCAT(DISTINCT oi.name) as itemNames
      FROM orders o
      LEFT JOIN order_items oi ON oi.orderId = o.id
      WHERE o.createdAt BETWEEN ? AND ?
    `;
    const params: any[] = [start, end];

    if (status && status !== "all") {
      query += " AND o.status = ?";
      params.push(status);
    }

    if (source && source !== "all") {
      query += " AND o.source = ?";
      params.push(source);
    }

    query += " GROUP BY o.id ORDER BY o.createdAt DESC";

    const orders = db.prepare(query).all(...params) as any[];

    // Calculate totals
    let totalsQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as totalOrders,
        SUM(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE 0 END) as totalSales,
        AVG(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE NULL END) as avgOrderValue,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.customerId ELSE NULL END) as uniqueCustomers
      FROM orders o
      WHERE o.createdAt BETWEEN ? AND ?
    `;
    
    const totalsParams: any[] = [start, end];
    if (status && status !== "all") {
      totalsQuery += " AND o.status = ?";
      totalsParams.push(status);
    }
    if (source && source !== "all") {
      totalsQuery += " AND o.source = ?";
      totalsParams.push(source);
    }

    const totals = db.prepare(totalsQuery).get(...totalsParams) as any;

    // Daily breakdown
    let dailyQuery = `
      SELECT 
        strftime('%Y-%m-%d', datetime(o.createdAt, 'unixepoch')) as date,
        COUNT(DISTINCT o.id) as orders,
        SUM(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE 0 END) as sales,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.customerId ELSE NULL END) as customers
      FROM orders o
      WHERE o.createdAt BETWEEN ? AND ?
    `;
    
    const dailyParams: any[] = [start, end];
    if (status && status !== "all") {
      dailyQuery += " AND o.status = ?";
      dailyParams.push(status);
    }
    if (source && source !== "all") {
      dailyQuery += " AND o.source = ?";
      dailyParams.push(source);
    }
    dailyQuery += " GROUP BY date ORDER BY date DESC";

    const dailyData = db.prepare(dailyQuery).all(...dailyParams) as any[];

    // Category breakdown (from order items)
    let categoryQuery = `
      SELECT 
        mi.category,
        COUNT(DISTINCT oi.orderId) as orderCount,
        SUM(oi.quantity) as totalQuantity,
        SUM(oi.price * oi.quantity) as totalRevenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      JOIN menu_items mi ON mi.id = oi.menuItemId
      WHERE o.createdAt BETWEEN ? AND ?
    `;
    
    const categoryParams: any[] = [start, end];
    if (status && status !== "all") {
      categoryQuery += " AND o.status = ?";
      categoryParams.push(status);
    }
    if (source && source !== "all") {
      categoryQuery += " AND o.source = ?";
      categoryParams.push(source);
    }
    categoryQuery += " GROUP BY mi.category ORDER BY totalRevenue DESC";

    const categoryData = db.prepare(categoryQuery).all(...categoryParams) as any[];

    // Top selling items
    let topItemsQuery = `
      SELECT 
        oi.menuItemId,
        mi.name,
        SUM(oi.quantity) as totalQuantity,
        SUM(oi.price * oi.quantity) as totalRevenue,
        COUNT(DISTINCT oi.orderId) as orderCount
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      JOIN menu_items mi ON mi.id = oi.menuItemId
      WHERE o.createdAt BETWEEN ? AND ?
    `;
    
    const topItemsParams: any[] = [start, end];
    if (status && status !== "all") {
      topItemsQuery += " AND o.status = ?";
      topItemsParams.push(status);
    }
    if (source && source !== "all") {
      topItemsQuery += " AND o.source = ?";
      topItemsParams.push(source);
    }
    topItemsQuery += " GROUP BY oi.menuItemId, mi.name ORDER BY totalRevenue DESC LIMIT 20";

    const topItems = db.prepare(topItemsQuery).all(...topItemsParams) as any[];

    return NextResponse.json({
      orders: orders.map(o => ({
        ...o,
        createdAt: formatTimestamp(o.createdAt),
        updatedAt: formatTimestamp(o.updatedAt),
      })),
      totals: {
        totalOrders: totals.totalOrders || 0,
        totalSales: totals.totalSales || 0,
        avgOrderValue: Math.round(totals.avgOrderValue || 0),
        uniqueCustomers: totals.uniqueCustomers || 0,
      },
      dailyData,
      categoryData,
      topItems,
    });
  } catch (error) {
    console.error("Sales report error:", error);
    return NextResponse.json(
      { error: "Failed to generate sales report" },
      { status: 500 }
    );
  }
}

