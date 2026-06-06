import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import * as productsService from "@/services/productsService";

/**
 * GET /api/menu-items/[id]/ingredients
 * Get ingredients for a specific menu item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);

    if (error) {
      return error;
    }

    if (user?.role !== "super_admin") {
      return NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 });
    }

    const ingredients = productsService.getMenuIngredients(params.id);

    // Transform to match expected format (for backward compatibility)
    const transformedIngredients = ingredients.map(ing => ({
      id: ing.id,
      productId: ing.productId,
      rawMaterialId: ing.productId, // For backward compatibility
      quantity: ing.quantity,
      unit: ing.unit,
      productName: ing.productName,
      productType: ing.productType,
      productUnit: ing.productUnit
    }));

    return NextResponse.json({
      success: true,
      data: transformedIngredients
    });
  } catch (error) {
    console.error("Error fetching menu ingredients:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اجزای منو" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu-items/[id]/ingredients
 * Add ingredient to menu item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);

    if (error) {
      return error;
    }

    if (user?.role !== "super_admin") {
      return NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 });
    }

    const body = await request.json();

    // Support both productId (from component) and rawMaterialId (for backward compatibility)
    const productId = body.productId || body.rawMaterialId;
    
    if (!productId || !body.quantity || !body.unit) {
      return NextResponse.json(
        { error: "محصول، مقدار و واحد الزامی است" },
        { status: 400 }
      );
    }

    try {
      productsService.addMenuIngredient(
        params.id,
        productId,
        body.quantity,
        body.unit
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "محصول یافت نشد" },
          { status: 404 }
        );
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "این ماده اولیه قبلا اضافه شده است" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: "ماده اولیه به منو افزوده شد"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding menu ingredient:", error);
    return NextResponse.json(
      { error: "خطا در افزودن ماده اولیه" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu-items/[id]/ingredients?ingredientId=xxx
 * Remove ingredient from menu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = validateSession(request);

    if (error) {
      return error;
    }

    if (user?.role !== "super_admin") {
      return NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ingredientId = searchParams.get("ingredientId");

    if (!ingredientId) {
      return NextResponse.json(
        { error: "شناسه ماده اولیه الزامی است" },
        { status: 400 }
      );
    }

    // Remove ingredient using productsService
    const removed = productsService.removeMenuIngredient(ingredientId);
    
    if (!removed) {
      return NextResponse.json(
        { error: "ماده اولیه یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "ماده اولیه حذف شد"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing menu ingredient:", error);
    return NextResponse.json(
      { error: "خطا در حذف ماده اولیه" },
      { status: 500 }
    );
  }
}
