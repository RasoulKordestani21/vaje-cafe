import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { verifyStaffAuth } from "@/lib/staffAuthMiddleware";

const ROLE_DEFAULT_TABS: Record<string, string[]> = {
  waiter: ["orders"],
  barista: ["orders", "customer-orders"],
  manager: ["dashboard", "orders", "customer-orders", "stats"]
};

// GET current staff member's enabled dashboard tabs
export async function GET(request: NextRequest) {
  const auth = await verifyStaffAuth(request);

  if (!auth.authenticated || !auth.staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT tab_name FROM staff_tab_permissions
         WHERE staff_id = ? AND enabled = 1`
      )
      .all(auth.staff.id) as { tab_name: string }[];

    const permissions =
      rows.length > 0
        ? rows.map(row => row.tab_name)
        : ROLE_DEFAULT_TABS[auth.staff.role] || ["orders"];

    return NextResponse.json({
      role: auth.staff.role,
      permissions
    });
  } catch (error) {
    console.error("Staff my-tabs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tab permissions" },
      { status: 500 }
    );
  }
}
