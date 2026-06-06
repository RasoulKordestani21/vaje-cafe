import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";

// GET staff tab permissions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const permissions = db.prepare(`
      SELECT tab_name, enabled FROM staff_tab_permissions 
      WHERE staff_id = ?
    `).all(id) as any[];

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Staff tabs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tab permissions" },
      { status: 500 }
    );
  }
}

// PUT update staff tab permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { tabs } = body;

    if (!Array.isArray(tabs)) {
      return NextResponse.json(
        { error: "Tabs must be an array" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // Get all possible tabs
    const allTabs = ["dashboard", "menu", "orders", "inventory", "customer-orders", "branches", "customers", "settings", "banners", "working-hours", "expenses", "ratings", "customer-messages", "staff", "stats"];

    // Update or insert tab permissions
    for (const tab of allTabs) {
      const enabled = tabs.includes(tab) ? 1 : 0;
      const existing = db.prepare(`
        SELECT id FROM staff_tab_permissions WHERE staff_id = ? AND tab_name = ?
      `).get(id, tab) as any;

      if (existing) {
        db.prepare(`
          UPDATE staff_tab_permissions 
          SET enabled = ?, updated_at = ?
          WHERE staff_id = ? AND tab_name = ?
        `).run(enabled, now, id, tab);
      } else {
        const permId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO staff_tab_permissions (id, staff_id, tab_name, enabled, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(permId, id, tab, enabled, now, now);
      }
    }

    const updated = db.prepare(`
      SELECT tab_name, enabled FROM staff_tab_permissions 
      WHERE staff_id = ? AND enabled = 1
    `).all(id) as any[];

    return NextResponse.json({
      permissions: updated.map(p => p.tab_name),
    });
  } catch (error) {
    console.error("Staff tabs PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update tab permissions" },
      { status: 500 }
    );
  }
}



