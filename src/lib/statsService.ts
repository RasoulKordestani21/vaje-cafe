import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.EXTERNAL_DB_PATH
  ? path.resolve(process.env.EXTERNAL_DB_PATH, "vaje-cafe.db")
  : path.join(process.cwd(), "data", "vaje-cafe.db");

const db = new Database(dbPath);

export interface Stat {
  id: number;
  event_type: "visit" | "order" | "menu_view";
  event_data: string; // JSON stringified
  created_at: number;
}

export interface DailyStat {
  date: string;
  visits: number;
  orders: number;
  sales: number;
}

/**
 * Initialize stats table if it doesn't exist
 */
export function initStatsTable() {
  const checkTable = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='stats'"
    )
    .all();

  if (checkTable.length === 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_data TEXT,
        created_at INTEGER NOT NULL,
        UNIQUE(event_type, event_data, created_at)
      );

      CREATE INDEX IF NOT EXISTS idx_stats_event_type ON stats(event_type);
      CREATE INDEX IF NOT EXISTS idx_stats_created_at ON stats(created_at);
    `);
    console.log("✓ Stats table initialized");
  }
}

/**
 * Record a visit or event with page/URL tracking
 */
export function recordEvent(
  eventType: "visit" | "order" | "menu_view",
  eventData?: any
) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Ensure eventData includes page information for visits
    const data = eventData || {};
    if (eventType === "visit" && !data.page) {
      data.page = "home";
    }
    const dataString = JSON.stringify(data);

    console.log(
      `[recordEvent] Recording ${eventType} at ${timestamp}:`,
      dataString
    );

    db.prepare(
      "INSERT INTO stats (event_type, event_data, created_at) VALUES (?, ?, ?)"
    ).run(eventType, dataString, timestamp);

    console.log(
      `[recordEvent] Successfully inserted ${eventType} into database`
    );
    return { success: true };
  } catch (error) {
    console.error("Error recording event:", error);
    return { success: false, error };
  }
}

/**
 * Get statistics for a date range with comprehensive analytics
 */
export function getStats(
  startDate?: number,
  endDate?: number
): {
  visits: number;
  menuViews: number;
  orders: number;
  totalSales: number;
  dailyData: DailyStat[];
  pageVisits?: { page: string; count: number }[];
  avgOrderValue?: number;
  conversionRate?: number;
  topPages?: { page: string; visits: number }[];
} {
  const now = Math.floor(Date.now() / 1000);
  const start = startDate || now - 30 * 24 * 60 * 60; // Last 30 days
  const end = endDate || now;

  // Check if stats table has data
  try {
    const visitCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM stats WHERE event_type = 'visit' AND created_at BETWEEN ? AND ?"
      )
      .get(start, end) as any;

    const menuViewCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM stats WHERE event_type = 'menu_view' AND created_at BETWEEN ? AND ?"
      )
      .get(start, end) as any;

    const orderCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM stats WHERE event_type = 'order' AND created_at BETWEEN ? AND ?"
      )
      .get(start, end) as any;

    // Calculate total sales from orders table (all completed orders)
    const salesResult = db
      .prepare(
        "SELECT SUM(totalPrice) as total FROM orders WHERE status = 'completed' AND createdAt BETWEEN ? AND ?"
      )
      .get(start, end) as any;

    const totalSales = salesResult?.total || 0;

    // Daily breakdown from stats table
    const dailyStats = db
      .prepare(
        `
        SELECT 
          strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as date,
          SUM(CASE WHEN event_type = 'visit' THEN 1 ELSE 0 END) as visits,
          SUM(CASE WHEN event_type = 'order' THEN 1 ELSE 0 END) as orders,
          SUM(CASE WHEN event_type = 'menu_view' THEN 1 ELSE 0 END) as menu_views
        FROM stats
        WHERE created_at BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date DESC
      `
      )
      .all(start, end) as any[];

    // Page visit breakdown
    const pageVisitsData = db
      .prepare(
        `
        SELECT 
          json_extract(event_data, '$.page') as page,
          COUNT(*) as count
        FROM stats
        WHERE event_type = 'visit' AND created_at BETWEEN ? AND ?
        GROUP BY page
        ORDER BY count DESC
      `
      )
      .all(start, end) as any[];

    // Enrich daily stats with sales data from orders
    const dailyDataWithSales = dailyStats.map((stat: any) => {
      const dayStart = new Date(stat.date).getTime() / 1000;
      const dayEnd = dayStart + 24 * 60 * 60;

      const daySalesResult = db
        .prepare(
          "SELECT SUM(totalPrice) as total FROM orders WHERE status = 'completed' AND createdAt BETWEEN ? AND ?"
        )
        .get(Math.floor(dayStart), Math.floor(dayEnd)) as any;

      const daySales = daySalesResult?.total || 0;

      return {
        date: stat.date,
        visits: stat.visits || 0,
        orders: stat.orders || 0,
        sales: daySales
      };
    });

    // Calculate average order value
    const avgOrderValue =
      orderCount.count > 0 ? Math.round(totalSales / orderCount.count) : 0;

    // Calculate conversion rate (orders / visits * 100)
    const conversionRate =
      visitCount.count > 0
        ? Math.round((orderCount.count / visitCount.count) * 10000) / 100
        : 0;

    return {
      visits: visitCount.count || 0,
      menuViews: menuViewCount.count || 0,
      orders: orderCount.count || 0,
      totalSales,
      dailyData: dailyDataWithSales,
      pageVisits: pageVisitsData.map((p: any) => ({
        page: p.page || "home",
        count: p.count || 0
      })),
      avgOrderValue,
      conversionRate,
      topPages: pageVisitsData.slice(0, 5).map((p: any) => ({
        page: p.page || "home",
        visits: p.count || 0
      }))
    };
  } catch (error) {
    console.log("Stats table not fully initialized, returning default stats");
    return {
      visits: 0,
      menuViews: 0,
      orders: 0,
      totalSales: 0,
      dailyData: [],
      pageVisits: [],
      avgOrderValue: 0,
      conversionRate: 0,
      topPages: []
    };
  }
}

/**
 * Get category breakdown from orders
 */
export function getCategoryBreakdown() {
  try {
    const categoryStats = db
      .prepare(
        `
        SELECT 
          m.category,
          COUNT(oi.id) as item_count,
          SUM(oi.price * oi.quantity) as total_sales
        FROM order_items oi
        JOIN menu_items m ON oi.menuItemId = m.id
        GROUP BY m.category
        ORDER BY total_sales DESC
      `
      )
      .all() as any[];

    return categoryStats.map((stat: any) => ({
      name: stat.category,
      value:
        Math.round((stat.total_sales / getTotalSalesFromOrders()) * 100) || 0,
      sales: stat.total_sales || 0,
      itemCount: stat.item_count || 0
    }));
  } catch (error) {
    console.warn("Failed to get category breakdown:", error);
    return [];
  }
}

/**
 * Get total sales from all orders
 */
function getTotalSalesFromOrders(): number {
  try {
    const result = db
      .prepare("SELECT SUM(totalPrice) as total FROM orders")
      .get() as any;
    return result.total || 0;
  } catch (error) {
    return 0;
  }
}

export default {
  initStatsTable,
  recordEvent,
  getStats,
  getCategoryBreakdown
};
