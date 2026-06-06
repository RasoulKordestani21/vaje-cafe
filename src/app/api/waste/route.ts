import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { validateSession } from "@/lib/authMiddleware";
import crypto from "crypto";

// GET all waste records
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
    const wasteType = searchParams.get("wasteType");
    const productId = searchParams.get("productId");

    const now = Math.floor(Date.now() / 1000);
    const start = startDate || now - 30 * 24 * 60 * 60; // Default to last 30 days
    const end = endDate || now;

    let query = `
      SELECT *
      FROM waste_records
      WHERE created_at BETWEEN ? AND ?
    `;
    const params: any[] = [start, end];

    if (wasteType && wasteType !== "all") {
      query += " AND waste_type = ?";
      params.push(wasteType);
    }

    if (productId) {
      query += " AND product_id = ?";
      params.push(productId);
    }

    query += " ORDER BY created_at DESC";

    const wasteRecords = db.prepare(query).all(...params) as any[];

    // Calculate totals
    let totalsQuery = `
      SELECT 
        COUNT(*) as totalRecords,
        SUM(quantity) as totalQuantity,
        SUM(total_cost) as totalCost,
        AVG(total_cost) as avgCost
      FROM waste_records
      WHERE created_at BETWEEN ? AND ?
    `;

    const totalsParams: any[] = [start, end];
    if (wasteType && wasteType !== "all") {
      totalsQuery += " AND waste_type = ?";
      totalsParams.push(wasteType);
    }
    if (productId) {
      totalsQuery += " AND product_id = ?";
      totalsParams.push(productId);
    }

    const totals = db.prepare(totalsQuery).get(...totalsParams) as any;

    // Group by waste type
    let typeBreakdownQuery = `
      SELECT 
        waste_type,
        COUNT(*) as count,
        SUM(quantity) as totalQuantity,
        SUM(total_cost) as totalCost
      FROM waste_records
      WHERE created_at BETWEEN ? AND ?
    `;

    const typeBreakdownParams: any[] = [start, end];
    if (wasteType && wasteType !== "all") {
      typeBreakdownQuery += " AND waste_type = ?";
      typeBreakdownParams.push(wasteType);
    }
    if (productId) {
      typeBreakdownQuery += " AND product_id = ?";
      typeBreakdownParams.push(productId);
    }
    typeBreakdownQuery += " GROUP BY waste_type ORDER BY totalCost DESC";

    const typeBreakdown = db.prepare(typeBreakdownQuery).all(...typeBreakdownParams) as any[];

    // Daily breakdown
    let dailyBreakdownQuery = `
      SELECT 
        strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as date,
        COUNT(*) as records,
        SUM(quantity) as totalQuantity,
        SUM(total_cost) as totalCost
      FROM waste_records
      WHERE created_at BETWEEN ? AND ?
    `;

    const dailyBreakdownParams: any[] = [start, end];
    if (wasteType && wasteType !== "all") {
      dailyBreakdownQuery += " AND waste_type = ?";
      dailyBreakdownParams.push(wasteType);
    }
    if (productId) {
      dailyBreakdownQuery += " AND product_id = ?";
      dailyBreakdownParams.push(productId);
    }
    dailyBreakdownQuery += " GROUP BY date ORDER BY date DESC";

    const dailyBreakdown = db.prepare(dailyBreakdownQuery).all(...dailyBreakdownParams) as any[];

    // Top wasted products
    let topProductsQuery = `
      SELECT 
        product_id,
        product_name,
        category,
        COUNT(*) as wasteCount,
        SUM(quantity) as totalQuantity,
        SUM(total_cost) as totalCost
      FROM waste_records
      WHERE created_at BETWEEN ? AND ?
    `;

    const topProductsParams: any[] = [start, end];
    if (wasteType && wasteType !== "all") {
      topProductsQuery += " AND waste_type = ?";
      topProductsParams.push(wasteType);
    }
    topProductsQuery += " GROUP BY product_id, product_name, category ORDER BY totalCost DESC LIMIT 20";

    const topProducts = db.prepare(topProductsQuery).all(...topProductsParams) as any[];

    return NextResponse.json({
      records: wasteRecords.map(record => ({
        ...record,
        // Keep timestamp as number for client-side formatting
      })),
      totals: {
        totalRecords: totals.totalRecords || 0,
        totalQuantity: totals.totalQuantity || 0,
        totalCost: totals.totalCost || 0,
        avgCost: Math.round(totals.avgCost || 0),
      },
      typeBreakdown,
      dailyBreakdown,
      topProducts,
    });
  } catch (error) {
    console.error("Waste GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waste records" },
      { status: 500 }
    );
  }
}

// POST create new waste record
export async function POST(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = getDatabase();
    const body = await request.json();
    const {
      product_id,
      product_name,
      category,
      waste_type,
      quantity,
      unit,
      cost_per_unit,
      reason,
    } = body;

    if (!product_name || !waste_type || !quantity || !unit || cost_per_unit === undefined) {
      return NextResponse.json(
        { error: "product_name, waste_type, quantity, unit, and cost_per_unit are required" },
        { status: 400 }
      );
    }

    const validWasteTypes = ["expired", "damaged", "spillage", "overproduction", "other"];
    if (!validWasteTypes.includes(waste_type)) {
      return NextResponse.json(
        { error: `waste_type must be one of: ${validWasteTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const total_cost = quantity * cost_per_unit;
    const now = Math.floor(Date.now() / 1000);
    const id = crypto.randomUUID();

    // Insert waste record
    db.prepare(`
      INSERT INTO waste_records (
        id, product_id, product_name, category, waste_type, quantity, unit,
        cost_per_unit, total_cost, reason, recorded_by, recorded_by_name,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      product_id || null,
      product_name,
      category || null,
      waste_type,
      quantity,
      unit,
      cost_per_unit,
      total_cost,
      reason || null,
      user.id,
      user.name || "Admin",
      now,
      now
    );

    // Update product stock if product_id is provided
    if (product_id) {
      try {
        const product = db.prepare("SELECT currentStock FROM products WHERE id = ?").get(product_id) as any;
        if (product) {
          const newStock = Math.max(0, (product.currentStock || 0) - quantity);
          db.prepare(`
            UPDATE products 
            SET currentStock = ?, updatedAt = ?
            WHERE id = ?
          `).run(newStock, now, product_id);

          // Create inventory log entry
          const logId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO inventory_logs (
              id, productId, changeType, quantity, previousStock, newStock, note, createdAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            logId,
            product_id,
            "manual_remove",
            quantity,
            product.currentStock || 0,
            newStock,
            `Waste record: ${waste_type}${reason ? ` - ${reason}` : ""}`,
            now
          );
        }
      } catch (stockError) {
        console.error("Failed to update product stock:", stockError);
        // Don't fail the waste record creation if stock update fails
      }
    }

    const record = db.prepare("SELECT * FROM waste_records WHERE id = ?").get(id) as any;

    return NextResponse.json(
      {
        ...record,
        // Timestamps are returned as numbers from SQLite
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waste POST error:", error);
    return NextResponse.json(
      { error: "Failed to create waste record" },
      { status: 500 }
    );
  }
}

