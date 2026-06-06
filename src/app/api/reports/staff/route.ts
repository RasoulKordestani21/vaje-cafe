import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
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
    const staffId = searchParams.get("staffId"); // Optional filter by specific staff

    const now = Math.floor(Date.now() / 1000);
    const start = startDate || now - 30 * 24 * 60 * 60;
    const end = endDate || now;

    // Get all staff
    let staffQuery = "SELECT * FROM staff WHERE is_active = 1";
    const staffParams: any[] = [];
    if (staffId) {
      staffQuery += " AND id = ?";
      staffParams.push(staffId);
    }
    staffQuery += " ORDER BY name";

    const staff = db.prepare(staffQuery).all(...staffParams) as any[];

    // Get performance metrics for each staff member
    const performanceData = staff.map(member => {
      // Orders handled by this staff member
      const ordersQuery = `
        SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END) as totalSales,
          AVG(CASE WHEN status = 'completed' THEN totalPrice ELSE NULL END) as avgOrderValue
        FROM orders
        WHERE (createdAt BETWEEN ? AND ?)
        AND customerName LIKE ? OR customerPhone IN (
          SELECT phone FROM customers WHERE id IN (
            SELECT customerId FROM orders WHERE customerId IS NOT NULL
          )
        )
      `;

      // Actually, let's use order_status_history to track staff actions
      const orderActions = db.prepare(`
        SELECT COUNT(*) as actionCount
        FROM order_status_history
        WHERE changed_by_type = 'staff'
        AND changed_by_id = ?
        AND created_at BETWEEN ? AND ?
      `).get(member.id, start, end) as any;

      // Get staff notifications (tasks assigned)
      const notifications = db.prepare(`
        SELECT 
          COUNT(*) as totalNotifications,
          SUM(CASE WHEN read = 1 THEN 1 ELSE 0 END) as readNotifications
        FROM staff_notifications
        WHERE staff_id = ?
        AND created_at BETWEEN ? AND ?
      `).get(member.id, start, end) as any;

      return {
        staffId: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        phone: member.phone,
        orderActions: orderActions?.actionCount || 0,
        totalNotifications: notifications?.totalNotifications || 0,
        readNotifications: notifications?.readNotifications || 0,
        notificationReadRate: notifications?.totalNotifications > 0 
          ? Math.round((notifications.readNotifications / notifications.totalNotifications) * 100)
          : 0,
      };
    });

    // Role-based summary
    const roleSummary = db.prepare(`
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeCount
      FROM staff
      GROUP BY role
    `).all() as any[];

    return NextResponse.json({
      staff: performanceData,
      roleSummary,
      totals: {
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.is_active).length,
      },
    });
  } catch (error) {
    console.error("Staff report error:", error);
    return NextResponse.json(
      { error: "Failed to generate staff report" },
      { status: 500 }
    );
  }
}


