import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
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

    const now = Math.floor(Date.now() / 1000);
    const start = startDate || now - 30 * 24 * 60 * 60;
    const end = endDate || now;

    // Get all raw materials with current stock
    const rawMaterials = db.prepare(`
      SELECT *
      FROM raw_materials
      ORDER BY name
    `).all() as any[];

    // For each raw material, calculate usage and restock from inventory_logs
    // Note: inventory_logs uses productId, so we need to check if there's a mapping
    // For now, we'll get basic stats without detailed logs since the schema differs
    const rawMaterialsWithStats = rawMaterials.map((rm: any) => {
      // Try to get logs if there's a way to map (this may need adjustment based on actual schema)
      // For now, return basic info
      return {
        ...rm,
        usageQuantity: 0, // Would need proper mapping
        restockQuantity: 0, // Would need proper mapping
      };
    });

    // Get inventory movements (logs) - note: this uses products, not raw_materials directly
    const movements: any[] = [];
    // Commented out until we clarify the relationship between products and raw_materials
    // const movements = db.prepare(`
    //   SELECT 
    //     il.*,
    //     p.name as productName
    //   FROM inventory_logs il
    //   JOIN products p ON p.id = il.productId
    //   WHERE il.created_at BETWEEN ? AND ?
    //   ORDER BY il.created_at DESC
    //   LIMIT 500
    // `).all(start, end) as any[];

    // Get low stock items
    const lowStock = db.prepare(`
      SELECT *
      FROM raw_materials
      WHERE current_stock <= min_stock
      ORDER BY (current_stock - min_stock) ASC
    `).all() as any[];

    // Calculate total inventory value
    const totalValue = rawMaterials.reduce((sum, rm) => {
      return sum + (rm.current_stock * (rm.price || 0));
    }, 0);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT 
        rm.category,
        COUNT(*) as itemCount,
        SUM(rm.current_stock * rm.price) as totalValue,
        SUM(CASE WHEN rm.current_stock <= rm.min_stock THEN 1 ELSE 0 END) as lowStockCount
      FROM raw_materials rm
      GROUP BY rm.category
      ORDER BY totalValue DESC
    `).all() as any[];

    return NextResponse.json({
      rawMaterials: rawMaterialsWithStats,
      movements: movements.map(m => ({
        ...m,
        created_at: new Date(m.created_at * 1000).toISOString(),
      })),
      lowStock,
      totals: {
        totalItems: rawMaterials.length,
        totalValue,
        lowStockCount: lowStock.length,
      },
      categoryBreakdown,
    });
  } catch (error) {
    console.error("Inventory report error:", error);
    return NextResponse.json(
      { error: "Failed to generate inventory report" },
      { status: 500 }
    );
  }
}

