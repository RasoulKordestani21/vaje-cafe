import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

// GET all working hours
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const hours = db.prepare("SELECT * FROM working_hours ORDER BY day_of_week").all();
    
    // Also get site status override
    const siteStatus = db.prepare("SELECT * FROM site_status LIMIT 1").get() as any;

    return NextResponse.json({ 
      workingHours: hours,
      siteStatus: siteStatus || { is_manually_closed: false }
    });
  } catch (error) {
    console.error("Working hours GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch working hours" },
      { status: 500 }
    );
  }
}

// PUT update working hours (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin can update working hours
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { workingHours, siteStatus } = body;

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Update working hours
    if (workingHours && Array.isArray(workingHours)) {
      const updateStmt = db.prepare(`
        UPDATE working_hours 
        SET open_time = ?, close_time = ?, is_closed = ?, updatedAt = ?
        WHERE day_of_week = ?
      `);

      for (const hour of workingHours) {
        const { day_of_week, open_time, close_time, is_closed } = hour;
        if (day_of_week !== undefined && day_of_week >= 0 && day_of_week <= 6) {
          updateStmt.run(
            open_time || "09:00",
            close_time || "23:00",
            is_closed ? 1 : 0,
            now,
            day_of_week
          );
        }
      }
    }

    // Update site status override
    if (siteStatus !== undefined) {
      const existing = db.prepare("SELECT id FROM site_status LIMIT 1").get() as { id: string } | undefined;
      
      if (existing) {
        db.prepare(`
          UPDATE site_status 
          SET is_manually_closed = ?, closed_until = ?, reason = ?, updatedAt = ?, updatedBy = ?
          WHERE id = ?
        `).run(
          siteStatus.is_manually_closed ? 1 : 0,
          siteStatus.closed_until || null,
          siteStatus.reason || null,
          now,
          user.id,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO site_status (id, is_manually_closed, closed_until, reason, updatedAt, updatedBy)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          siteStatus.is_manually_closed ? 1 : 0,
          siteStatus.closed_until || null,
          siteStatus.reason || null,
          now,
          user.id
        );
      }
    }

    return NextResponse.json({ success: true, message: "Working hours updated successfully" });
  } catch (error) {
    console.error("Working hours PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update working hours" },
      { status: 500 }
    );
  }
}

// GET current site status (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const currentTime = currentDate.toTimeString().slice(0, 5); // HH:MM format

    // Get site status override
    const siteStatus = db.prepare("SELECT * FROM site_status LIMIT 1").get() as any;
    const isManuallyClosed = siteStatus?.is_manually_closed === 1;

    if (isManuallyClosed) {
      const closedUntil = siteStatus.closed_until;
      if (closedUntil && closedUntil > now) {
        return NextResponse.json({
          isOpen: false,
          reason: siteStatus.reason || "کافه به صورت دستی بسته شده است",
          closedUntil: closedUntil
        });
      } else if (!closedUntil) {
        return NextResponse.json({
          isOpen: false,
          reason: siteStatus.reason || "کافه به صورت دستی بسته شده است"
        });
      }
    }

    // Get working hours for current day
    const todayHours = db.prepare("SELECT * FROM working_hours WHERE day_of_week = ?").get(currentDay) as any;

    if (!todayHours || todayHours.is_closed === 1) {
      return NextResponse.json({
        isOpen: false,
        reason: "کافه امروز تعطیل است"
      });
    }

    // Check if current time is within working hours
    const openTime = todayHours.open_time;
    const closeTime = todayHours.close_time;

    const isOpen = currentTime >= openTime && currentTime <= closeTime;

    return NextResponse.json({
      isOpen,
      reason: isOpen ? null : `ساعات کاری: ${openTime} - ${closeTime}`,
      workingHours: {
        open: openTime,
        close: closeTime
      }
    });
  } catch (error) {
    console.error("Site status check error:", error);
    return NextResponse.json(
      { error: "Failed to check site status" },
      { status: 500 }
    );
  }
}

