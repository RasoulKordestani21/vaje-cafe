import type Database from "better-sqlite3";
import { formatTimestamp } from "@/lib/database";
import { resolveReportRange } from "./dateRange";

type Db = Database.Database;

export interface SalesReportOptions {
  startDate?: number;
  endDate?: number;
  status?: string;
  source?: string;
}

export function getSalesReportData(db: Db, options: SalesReportOptions = {}) {
  const { start, end } = resolveReportRange(undefined, undefined, {
    start: options.startDate,
    end: options.endDate,
  });
  const status = options.status || "completed";
  const source = options.source;

  let query = `
    SELECT o.*, COUNT(DISTINCT oi.id) as itemCount, GROUP_CONCAT(DISTINCT oi.name) as itemNames
    FROM orders o
    LEFT JOIN order_items oi ON oi.orderId = o.id
    WHERE o.createdAt BETWEEN ? AND ?
  `;
  const params: unknown[] = [start, end];

  if (status && status !== "all") {
    query += " AND o.status = ?";
    params.push(status);
  }
  if (source && source !== "all") {
    query += " AND o.source = ?";
    params.push(source);
  }
  query += " GROUP BY o.id ORDER BY o.createdAt DESC";

  const orders = db.prepare(query).all(...params) as Record<string, unknown>[];

  let totalsQuery = `
    SELECT
      COUNT(DISTINCT o.id) as totalOrders,
      SUM(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE 0 END) as totalSales,
      AVG(CASE WHEN o.status = 'completed' THEN o.totalPrice ELSE NULL END) as avgOrderValue,
      COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.customerId ELSE NULL END) as uniqueCustomers
    FROM orders o WHERE o.createdAt BETWEEN ? AND ?
  `;
  const totalsParams: unknown[] = [start, end];
  if (status && status !== "all") {
    totalsQuery += " AND o.status = ?";
    totalsParams.push(status);
  }
  if (source && source !== "all") {
    totalsQuery += " AND o.source = ?";
    totalsParams.push(source);
  }
  const totals = db.prepare(totalsQuery).get(...totalsParams) as Record<string, number>;

  let categoryQuery = `
    SELECT mi.category, COUNT(DISTINCT oi.orderId) as orderCount,
      SUM(oi.quantity) as totalQuantity, SUM(oi.price * oi.quantity) as totalRevenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.orderId
    JOIN menu_items mi ON mi.id = oi.menuItemId
    WHERE o.createdAt BETWEEN ? AND ?
  `;
  const categoryParams: unknown[] = [start, end];
  if (status && status !== "all") {
    categoryQuery += " AND o.status = ?";
    categoryParams.push(status);
  }
  if (source && source !== "all") {
    categoryQuery += " AND o.source = ?";
    categoryParams.push(source);
  }
  categoryQuery += " GROUP BY mi.category ORDER BY totalRevenue DESC";
  const categoryData = db.prepare(categoryQuery).all(...categoryParams);

  let topItemsQuery = `
    SELECT oi.menuItemId, mi.name, SUM(oi.quantity) as totalQuantity,
      SUM(oi.price * oi.quantity) as totalRevenue, COUNT(DISTINCT oi.orderId) as orderCount
    FROM order_items oi
    JOIN orders o ON o.id = oi.orderId
    JOIN menu_items mi ON mi.id = oi.menuItemId
    WHERE o.createdAt BETWEEN ? AND ?
  `;
  const topItemsParams: unknown[] = [start, end];
  if (status && status !== "all") {
    topItemsQuery += " AND o.status = ?";
    topItemsParams.push(status);
  }
  if (source && source !== "all") {
    topItemsQuery += " AND o.source = ?";
    topItemsParams.push(source);
  }
  topItemsQuery += " GROUP BY oi.menuItemId, mi.name ORDER BY totalRevenue DESC";
  const itemSales = db.prepare(topItemsQuery).all(...topItemsParams);

  return {
    orders: orders.map(o => ({
      ...o,
      createdAt: o.createdAt ? formatTimestamp(o.createdAt as number) : "",
      updatedAt: o.updatedAt ? formatTimestamp(o.updatedAt as number) : "",
    })),
    totals: {
      totalOrders: totals.totalOrders || 0,
      totalSales: totals.totalSales || 0,
      avgOrderValue: Math.round(totals.avgOrderValue || 0),
      uniqueCustomers: totals.uniqueCustomers || 0,
    },
    categoryData,
    itemSales,
    topItems: itemSales,
  };
}

export interface InventoryReportOptions {
  startDate?: number;
  endDate?: number;
}

export function getInventoryReportData(db: Db, _options: InventoryReportOptions = {}) {
  const products = db
    .prepare(`SELECT * FROM products ORDER BY name`)
    .all() as Record<string, unknown>[];

  const formatCategory = (p: Record<string, unknown>) => {
    const group = p.categoryGroup as string | undefined;
    const sub = p.category as string | undefined;
    if (group && sub) return `${group} › ${sub}`;
    return sub || group || "—";
  };

  const rawMaterialsWithStats = products.map(p => ({
    ...p,
    category: formatCategory(p),
    current_stock: p.currentStock,
    min_stock: p.minStock,
    usageQuantity: 0,
    restockQuantity: 0,
  }));

  const lowStock = db
    .prepare(`
    SELECT * FROM products WHERE currentStock <= minStock
    ORDER BY (currentStock - minStock) ASC
  `)
    .all()
    .map(p => {
      const row = p as Record<string, unknown>;
      return {
        ...row,
        category: formatCategory(row),
        current_stock: row.currentStock,
        min_stock: row.minStock,
      };
    });

  const totalValue = products.reduce(
    (sum, p) =>
      sum + ((p.currentStock as number) * ((p.price as number) || 0)),
    0
  );

  const categoryBreakdown = db
    .prepare(`
    SELECT
      COALESCE(categoryGroup, 'سایر') as categoryGroup,
      category,
      COUNT(*) as itemCount,
      SUM(currentStock * price) as totalValue,
      SUM(CASE WHEN currentStock <= minStock THEN 1 ELSE 0 END) as lowStockCount
    FROM products
    GROUP BY categoryGroup, category
    ORDER BY totalValue DESC
  `)
    .all()
    .map(row => {
      const r = row as Record<string, unknown>;
      const group = r.categoryGroup as string;
      const sub = r.category as string;
      return {
        ...r,
        category: group && sub && group !== "سایر" ? `${group} › ${sub}` : sub || group,
      };
    });

  return {
    rawMaterials: rawMaterialsWithStats,
    lowStock,
    totals: {
      totalItems: products.length,
      totalValue,
      lowStockCount: lowStock.length,
    },
    categoryBreakdown,
  };
}

export interface StaffReportOptions {
  startDate?: number;
  endDate?: number;
  staffId?: string;
}

export function getStaffReportData(db: Db, options: StaffReportOptions = {}) {
  const { start, end } = resolveReportRange(undefined, undefined, {
    start: options.startDate,
    end: options.endDate,
  });

  let staffQuery = "SELECT * FROM staff WHERE is_active = 1";
  const staffParams: unknown[] = [];
  if (options.staffId) {
    staffQuery += " AND id = ?";
    staffParams.push(options.staffId);
  }
  staffQuery += " ORDER BY name";
  const staff = db.prepare(staffQuery).all(...staffParams) as Record<string, unknown>[];

  const performanceData = staff.map(member => {
    const orderActions = db.prepare(`
      SELECT COUNT(*) as actionCount FROM order_status_history
      WHERE changed_by_type = 'staff' AND changed_by_id = ? AND created_at BETWEEN ? AND ?
    `).get(member.id, start, end) as { actionCount?: number };

    const notifications = db.prepare(`
      SELECT COUNT(*) as totalNotifications,
        SUM(CASE WHEN "read" = 1 THEN 1 ELSE 0 END) as readNotifications
      FROM staff_notifications WHERE staff_id = ? AND created_at BETWEEN ? AND ?
    `).get(member.id, start, end) as { totalNotifications?: number; readNotifications?: number };

    const totalNotifications = notifications?.totalNotifications || 0;
    return {
      staffId: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone,
      orderActions: orderActions?.actionCount || 0,
      totalNotifications,
      readNotifications: notifications?.readNotifications || 0,
      notificationReadRate: totalNotifications > 0
        ? Math.round(((notifications?.readNotifications || 0) / totalNotifications) * 100)
        : 0,
    };
  });

  const roleSummary = db.prepare(`
    SELECT role, COUNT(*) as count, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeCount
    FROM staff GROUP BY role
  `).all();

  return {
    staff: performanceData,
    roleSummary,
    totals: {
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.is_active).length,
    },
  };
}

export interface CustomersReportOptions {
  startDate?: number;
  endDate?: number;
}

export function getCustomersReportData(db: Db, options: CustomersReportOptions = {}) {
  const { start, end } = resolveReportRange(undefined, undefined, {
    start: options.startDate,
    end: options.endDate,
  });

  const customerStats = db.prepare(`
    SELECT c.*,
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
  `).all(start, end, start, end) as Record<string, unknown>[];

  const segments = {
    vip: customerStats.filter(c => ((c.totalSpent as number) || 0) >= 1000000).length,
    regular: customerStats.filter(c => {
      const spent = (c.totalSpent as number) || 0;
      return spent >= 200000 && spent < 1000000;
    }).length,
    new: customerStats.filter(c => ((c.totalSpent as number) || 0) < 200000).length,
  };

  const newCustomers = db.prepare(`
    SELECT COUNT(*) as count FROM customers WHERE createdAt BETWEEN ? AND ?
  `).get(start, end) as { count?: number };

  const avgOrderValue = customerStats.length > 0
    ? Math.round(
        customerStats.reduce((sum, c) => sum + ((c.totalSpent as number) || 0), 0) /
        customerStats.reduce((sum, c) => sum + ((c.totalOrders as number) || 0), 1)
      )
    : 0;

  const topCustomers = [...customerStats]
    .sort((a, b) => ((b.totalSpent as number) || 0) - ((a.totalSpent as number) || 0));

  const loyaltyStats = db.prepare(`
    SELECT COUNT(DISTINCT customer_id) as customersWithPoints,
      SUM(points) as totalPointsAwarded,
      SUM(CASE WHEN transaction_type = 'redeemed' THEN points ELSE 0 END) as totalPointsRedeemed
    FROM loyalty_points WHERE created_at BETWEEN ? AND ?
  `).get(start, end) as Record<string, number>;

  const customers = customerStats.map(c => ({
    ...c,
    ordersInPeriod: c.ordersInPeriod || 0,
    spentInPeriod: c.spentInPeriod || 0,
    totalOrders: c.totalOrders || 0,
    totalSpent: c.totalSpent || 0,
  }));

  return {
    customers,
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
  };
}

export type ReportType = "sales" | "inventory" | "staff" | "customers";

export function getReportData(
  db: Db,
  type: ReportType,
  startDate?: number,
  endDate?: number
) {
  const opts = { startDate, endDate };
  switch (type) {
    case "sales":
      return getSalesReportData(db, { ...opts, status: "completed" });
    case "inventory":
      return getInventoryReportData(db, opts);
    case "staff":
      return getStaffReportData(db, opts);
    case "customers":
      return getCustomersReportData(db, opts);
    default:
      throw new Error(`Invalid report type: ${type}`);
  }
}
