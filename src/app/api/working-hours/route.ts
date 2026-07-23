import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";
import { v4 as uuidv4 } from "uuid";
import {
  DAY_NAMES_FA,
  formatTimestampTehranFa,
  getTehranNowParts,
  isManualClosureActive,
  isTimeWithinRange,
  normalizeTime,
} from "@/utils/workingHoursUtils";

initializeDatabase();

function normalizeWorkingHourRow(hour: Record<string, unknown>) {
  return {
    ...hour,
    open_time: normalizeTime(String(hour.open_time || "09:00")),
    close_time: normalizeTime(String(hour.close_time || "23:00")),
  };
}

export async function GET() {
  try {
    const db = getDatabase();
    const hours = db
      .prepare("SELECT * FROM working_hours ORDER BY day_of_week")
      .all()
      .map((hour) => normalizeWorkingHourRow(hour as Record<string, unknown>));

    const siteStatus = db.prepare("SELECT * FROM site_status LIMIT 1").get() as
      | Record<string, unknown>
      | undefined;

    return NextResponse.json({
      workingHours: hours,
      siteStatus: siteStatus || { is_manually_closed: false },
    });
  } catch (error) {
    console.error("Working hours GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch working hours" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { workingHours, siteStatus } = body;

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

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
            normalizeTime(open_time || "09:00"),
            normalizeTime(close_time || "23:00"),
            is_closed ? 1 : 0,
            now,
            day_of_week
          );
        }
      }
    }

    if (siteStatus !== undefined) {
      const existing = db.prepare("SELECT id FROM site_status LIMIT 1").get() as
        | { id: string }
        | undefined;
      const isManuallyClosed = siteStatus.is_manually_closed ? 1 : 0;
      let closedFrom = siteStatus.closed_from || null;
      let closedUntil = siteStatus.closed_until || null;

      if (isManuallyClosed && !closedFrom) {
        closedFrom = now;
      }

      if (!isManuallyClosed) {
        closedFrom = null;
        closedUntil = null;
      }

      if (existing) {
        db.prepare(`
          UPDATE site_status 
          SET is_manually_closed = ?, closed_from = ?, closed_until = ?, reason = ?, updatedAt = ?, updatedBy = ?
          WHERE id = ?
        `).run(
          isManuallyClosed,
          closedFrom,
          closedUntil,
          isManuallyClosed ? siteStatus.reason || null : null,
          now,
          auth.userId,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO site_status (id, is_manually_closed, closed_from, closed_until, reason, updatedAt, updatedBy)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          isManuallyClosed,
          closedFrom,
          closedUntil,
          isManuallyClosed ? siteStatus.reason || null : null,
          now,
          auth.userId
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

export async function POST() {
  try {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const { currentDay, currentTime } = getTehranNowParts();

    const siteStatus = db.prepare("SELECT * FROM site_status LIMIT 1").get() as {
      is_manually_closed?: number;
      closed_from?: number | null;
      closed_until?: number | null;
      reason?: string | null;
    } | undefined;

    const isManuallyClosed = siteStatus?.is_manually_closed === 1;
    const closedFrom = siteStatus?.closed_from ?? null;
    const closedUntil = siteStatus?.closed_until ?? null;

    if (isManualClosureActive(isManuallyClosed, closedFrom, closedUntil, now)) {
      const fromFormatted = closedFrom
        ? formatTimestampTehranFa(closedFrom)
        : formatTimestampTehranFa(now);
      const toFormatted = closedUntil ? formatTimestampTehranFa(closedUntil) : null;

      return NextResponse.json({
        isOpen: false,
        reason: siteStatus?.reason || "کافه به صورت دستی بسته شده است",
        closedUntil,
        closedFrom,
        manualClosure: {
          from: fromFormatted,
          to: toFormatted,
        },
      });
    }

    const todayHours = db
      .prepare("SELECT * FROM working_hours WHERE day_of_week = ?")
      .get(currentDay) as {
      open_time?: string;
      close_time?: string;
      is_closed?: number;
    } | undefined;

    if (!todayHours || todayHours.is_closed === 1) {
      return NextResponse.json({
        isOpen: false,
        reason: "کافه امروز تعطیل است",
        day: {
          index: currentDay,
          name: DAY_NAMES_FA[currentDay] || "",
        },
      });
    }

    const openTime = normalizeTime(todayHours.open_time || "09:00");
    const closeTime = normalizeTime(todayHours.close_time || "23:00");
    const isOpen = isTimeWithinRange(currentTime, openTime, closeTime);

    return NextResponse.json({
      isOpen,
      reason: isOpen ? null : `ساعات کاری: ${openTime} - ${closeTime}`,
      day: {
        index: currentDay,
        name: DAY_NAMES_FA[currentDay] || "",
      },
      workingHours: {
        open: openTime,
        close: closeTime,
      },
    });
  } catch (error) {
    console.error("Site status check error:", error);
    return NextResponse.json(
      { error: "Failed to check site status" },
      { status: 500 }
    );
  }
}
