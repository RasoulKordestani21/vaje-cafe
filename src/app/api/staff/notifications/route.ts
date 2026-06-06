import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyStaffAuth } from "@/lib/staffAuthMiddleware";

// GET notifications for staff
export async function GET(request: NextRequest) {
  const staffAuth = await verifyStaffAuth(request);
  
  if (!staffAuth.authenticated || !staffAuth.staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const staffId = staffAuth.staff.id;
    const role = staffAuth.staff.role;
    
    // Get unread notifications for this staff member or role
    const notifications = db.prepare(`
      SELECT n.*, o.tableNumber, o.totalPrice
      FROM staff_notifications n
      LEFT JOIN orders o ON n.order_id = o.id
      WHERE (n.staff_id = ? OR (n.staff_id IS NULL AND n.staff_role = ?))
        AND n.read = 0
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(staffId, role) as any[];

    const formattedNotifications = notifications.map(notif => ({
      ...notif,
      created_at: formatTimestamp(notif.created_at),
    }));

    return NextResponse.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error("Staff notifications GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH mark notification as read
export async function PATCH(request: NextRequest) {
  const staffAuth = await verifyStaffAuth(request);
  
  if (!staffAuth.authenticated || !staffAuth.staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const { notificationId } = await request.json();
    
    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Mark notification as read
    db.prepare(`
      UPDATE staff_notifications 
      SET read = 1 
      WHERE id = ? AND (staff_id = ? OR staff_id IS NULL)
    `).run(notificationId, staffAuth.staff.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
