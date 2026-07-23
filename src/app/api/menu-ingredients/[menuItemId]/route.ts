import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";
import * as rawMaterialsService from "@/services/rawMaterialsService";

/**
 * GET /api/menu-ingredients/[menuItemId]
 * Get ingredients for a specific menu item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { menuItemId: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const ingredients = rawMaterialsService.getMenuIngredients(
      params.menuItemId
    );

    return NextResponse.json({
      success: true,
      data: ingredients
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
 * POST /api/menu-ingredients/[menuItemId]
 * Add ingredient to menu item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { menuItemId: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();

    if (!body.rawMaterialId || !body.quantity || !body.unit) {
      return NextResponse.json(
        { error: "مادۀ اولیه، مقدار و واحد الزامی است" },
        { status: 400 }
      );
    }

    rawMaterialsService.addMenuIngredient(
      params.menuItemId,
      body.rawMaterialId,
      body.quantity,
      body.unit
    );

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
