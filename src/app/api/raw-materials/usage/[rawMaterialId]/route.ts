import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";
import * as productsService from "@/services/productsService";

/**
 * GET /api/raw-materials/usage/[rawMaterialId]
 * Get which menu items use this raw material (product)
 * Note: rawMaterialId is treated as productId in the unified system
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { rawMaterialId: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    // Use unified productsService - rawMaterialId is the same as productId
    const menuItems = productsService.getMenuItemsUsingProduct(params.rawMaterialId);
    
    // Get product details for cost calculation
    const product = productsService.getProduct(params.rawMaterialId);
    
    // Transform to match expected format
    const usage = menuItems.map(item => {
      const itemCost = item.quantity * (product?.price || 0);
      const menuItemPrice = item.menuItemPrice || 0;
      const costPercent =
        menuItemPrice > 0 ? Math.round((itemCost / menuItemPrice) * 100) : null;
      return {
        id: item.menuItemId,
        menu_item_id: item.menuItemId,
        menuItemName: item.menuItemName,
        menuItemPrice,
        quantity: item.quantity,
        unit: item.unit,
        current_stock: product?.currentStock || 0,
        price: product?.price || 0,
        itemCost,
        costPercent,
      };
    });

    return NextResponse.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error("Error fetching raw material usage:", error);
    return NextResponse.json(
      { error: "خطا در دریافت استفاده ماده اولیه" },
      { status: 500 }
    );
  }
}
