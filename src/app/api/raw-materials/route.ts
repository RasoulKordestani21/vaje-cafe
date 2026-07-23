import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";
import * as rawMaterialsService from "@/services/rawMaterialsService";

/**
 * GET /api/raw-materials
 * Get all raw materials (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const materials = rawMaterialsService.getRawMaterials();

    return NextResponse.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return NextResponse.json(
      { error: "خطا در دریافت مواد اولیه" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/raw-materials
 * Create new raw material (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category || !body.unit) {
      return NextResponse.json(
        { error: "نام، دسته‌بندی و واحد الزامی است" },
        { status: 400 }
      );
    }

    const material = rawMaterialsService.createRawMaterial({
      name: body.name,
      category: body.category,
      unit: body.unit,
      currentStock: body.currentStock || 0,
      minStock: body.minStock || 0,
      price: body.price || 0,
      supplier: body.supplier
    });

    return NextResponse.json(
      {
        success: true,
        data: material
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating raw material:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد ماده اولیه" },
      { status: 500 }
    );
  }
}
