import { getDatabase } from "@/lib/database";

interface DailyStat {
  date: string;
  visits: number;
  orders: number;
  sales: number;
}

interface CategoryBreakdown {
  name: string;
  value: number;
  itemCount: number;
}

interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface ComparisonData {
  todayVsYesterday: {
    orders: number;
    sales: number;
    ordersChange: number;
    salesChange: number;
  };
  thisWeekVsLastWeek: {
    orders: number;
    sales: number;
    ordersChange: number;
    salesChange: number;
  };
}

interface EnhancedAnalytics {
  visits: number;
  menuViews: number;
  totalSales: number;
  ordersCount: number;
  averageOrderValue: number;
  dailyData: DailyStat[];
  categoryBreakdown: CategoryBreakdown[];
  comparisonData: ComparisonData;
  topSellingItems: TopSellingItem[];
}

/**
 * Get enhanced analytics with comprehensive data
 */
export async function getEnhancedAnalytics(
  startDate?: number,
  endDate?: number
): Promise<EnhancedAnalytics> {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const start = startDate || now - 30 * 24 * 60 * 60; // Last 30 days
  const end = endDate || now;

  try {
    // Ensure stats table exists
    const checkTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='stats'")
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
    }

    // Basic stats - handle case where table might be empty
    let visitCount = { count: 0 };
    let menuViewCount = { count: 0 };
    
    try {
      visitCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM stats WHERE event_type = 'visit' AND created_at BETWEEN ? AND ?"
        )
        .get(start, end) as any;
    } catch (e) {
      console.warn("Error getting visit count:", e);
    }

    try {
      menuViewCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM stats WHERE event_type = 'menu_view' AND created_at BETWEEN ? AND ?"
        )
        .get(start, end) as any;
    } catch (e) {
      console.warn("Error getting menu view count:", e);
    }

    const orderCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM orders WHERE createdAt BETWEEN ? AND ?"
      )
      .get(start, end) as any;

    // Total sales from completed orders
    const salesResult = db
      .prepare(
        "SELECT SUM(totalPrice) as total FROM orders WHERE status = 'completed' AND createdAt BETWEEN ? AND ?"
      )
      .get(start, end) as any;

    const totalSales = salesResult?.total || 0;
    const ordersCount = orderCount?.count || 0;
    const averageOrderValue = ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0;

    // Daily breakdown - handle case where table might be empty
    let dailyStats: any[] = [];
    try {
      dailyStats = db
        .prepare(
          `
          SELECT 
            strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as date,
            SUM(CASE WHEN event_type = 'visit' THEN 1 ELSE 0 END) as visits,
            SUM(CASE WHEN event_type = 'menu_view' THEN 1 ELSE 0 END) as menu_views
          FROM stats
          WHERE created_at BETWEEN ? AND ?
          GROUP BY date
          ORDER BY date DESC
        `
        )
        .all(start, end) as any[];
    } catch (e) {
      console.warn("Error getting daily stats:", e);
    }

    // Enrich daily stats with orders and sales
    const dailyDataWithSales = dailyStats.map((stat: any) => {
      const dayStart = new Date(stat.date + "T00:00:00").getTime() / 1000;
      const dayEnd = dayStart + 24 * 60 * 60 - 1;

      const dayOrdersResult = db
        .prepare(
          "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END) as total FROM orders WHERE createdAt BETWEEN ? AND ?"
        )
        .get(Math.floor(dayStart), Math.floor(dayEnd)) as any;

      return {
        date: stat.date,
        visits: stat.visits || 0,
        orders: dayOrdersResult?.count || 0,
        sales: dayOrdersResult?.total || 0
      };
    });

    // Category breakdown from menu items
    const categoryData = db
      .prepare(
        `
        SELECT 
          category,
          COUNT(*) as itemCount,
          SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END) as availableCount
        FROM menu_items
        GROUP BY category
      `
      )
      .all() as any[];

    const categoryBreakdown = categoryData.map((cat: any) => {
      // Calculate category revenue from order items
      const categoryRevenue = db
        .prepare(
          `
          SELECT SUM(oi.quantity * oi.price) as total
          FROM order_items oi
          JOIN menu_items mi ON oi.menuItemId = mi.id
          JOIN orders o ON oi.orderId = o.id
          WHERE mi.category = ? AND o.status = 'completed' AND o.createdAt BETWEEN ? AND ?
        `
        )
        .get(cat.category, start, end) as any;

      return {
        name: cat.category,
        value: categoryRevenue?.total || 0,
        itemCount: cat.itemCount || 0
      };
    });

    // Top selling items
    const topItems = db
      .prepare(
        `
        SELECT 
          oi.menuItemId,
          mi.name,
          SUM(oi.quantity) as quantity,
          SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menuItemId = mi.id
        JOIN orders o ON oi.orderId = o.id
        WHERE o.status = 'completed' AND o.createdAt BETWEEN ? AND ?
        GROUP BY oi.menuItemId, mi.name
        ORDER BY quantity DESC
        LIMIT 10
      `
      )
      .all(start, end) as any[];

    const topSellingItems = topItems.map((item: any) => ({
      id: item.menuItemId,
      name: item.name,
      quantity: item.quantity || 0,
      revenue: item.revenue || 0
    }));

    // Comparison data: Today vs Yesterday
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const todayEnd = todayStart + 24 * 60 * 60 - 1;
    const yesterdayStart = todayStart - 24 * 60 * 60;
    const yesterdayEnd = todayStart - 1;

    const todayOrders = db
      .prepare(
        "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END) as total FROM orders WHERE createdAt BETWEEN ? AND ?"
      )
      .get(todayStart, todayEnd) as any;

    const yesterdayOrders = db
      .prepare(
        "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END) as total FROM orders WHERE createdAt BETWEEN ? AND ?"
      )
      .get(yesterdayStart, yesterdayEnd) as any;

    const todayOrdersCount = todayOrders?.count || 0;
    const todaySales = todayOrders?.total || 0;
    const yesterdayOrdersCount = yesterdayOrders?.count || 0;
    const yesterdaySales = yesterdayOrders?.total || 0;

    const ordersChange = yesterdayOrdersCount > 0
      ? Math.round(((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 10000) / 100
      : (todayOrdersCount > 0 ? 100 : 0);
    const salesChange = yesterdaySales > 0
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 10000) / 100
      : (todaySales > 0 ? 100 : 0);

    // Comparison data: This Week vs Last Week
    const weekStart = Math.floor(new Date().setDate(new Date().getDate() - new Date().getDay()) / 1000);
    const weekEnd = weekStart + 7 * 24 * 60 * 60 - 1;
    const lastWeekStart = weekStart - 7 * 24 * 60 * 60;
    const lastWeekEnd = weekStart - 1;

    const thisWeekOrders = db
      .prepare(
        "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END) as total FROM orders WHERE createdAt BETWEEN ? AND ?"
      )
      .get(weekStart, weekEnd) as any;

    const lastWeekOrders = db
      .prepare(
        "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END) as total FROM orders WHERE createdAt BETWEEN ? AND ?"
      )
      .get(lastWeekStart, lastWeekEnd) as any;

    const thisWeekOrdersCount = thisWeekOrders?.count || 0;
    const thisWeekSales = thisWeekOrders?.total || 0;
    const lastWeekOrdersCount = lastWeekOrders?.count || 0;
    const lastWeekSales = lastWeekOrders?.total || 0;

    const weekOrdersChange = lastWeekOrdersCount > 0
      ? Math.round(((thisWeekOrdersCount - lastWeekOrdersCount) / lastWeekOrdersCount) * 10000) / 100
      : (thisWeekOrdersCount > 0 ? 100 : 0);
    const weekSalesChange = lastWeekSales > 0
      ? Math.round(((thisWeekSales - lastWeekSales) / lastWeekSales) * 10000) / 100
      : (thisWeekSales > 0 ? 100 : 0);

    return {
      visits: visitCount?.count || 0,
      menuViews: menuViewCount?.count || 0,
      totalSales,
      ordersCount,
      averageOrderValue,
      dailyData: dailyDataWithSales,
      categoryBreakdown,
      comparisonData: {
        todayVsYesterday: {
          orders: todayOrdersCount,
          sales: todaySales,
          ordersChange,
          salesChange
        },
        thisWeekVsLastWeek: {
          orders: thisWeekOrdersCount,
          sales: thisWeekSales,
          ordersChange: weekOrdersChange,
          salesChange: weekSalesChange
        }
      },
      topSellingItems
    };
  } catch (error) {
    console.error("Error getting enhanced analytics:", error);
    // Return default structure on error
    return {
      visits: 0,
      menuViews: 0,
      totalSales: 0,
      ordersCount: 0,
      averageOrderValue: 0,
      dailyData: [],
      categoryBreakdown: [],
      comparisonData: {
        todayVsYesterday: {
          orders: 0,
          sales: 0,
          ordersChange: 0,
          salesChange: 0
        },
        thisWeekVsLastWeek: {
          orders: 0,
          sales: 0,
          ordersChange: 0,
          salesChange: 0
        }
      },
      topSellingItems: []
    };
  }
}
