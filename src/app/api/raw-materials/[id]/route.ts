import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";
import * as rawMaterialsService from "@/services/rawMaterialsService";

/**
 * GET /api/raw-materials/[id]
 * Get single raw material
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const material = rawMaterialsService.getRawMaterial(params.id);

    if (!material) {
      return NextResponse.json(
        { error: "ماده اولیه یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error("Error fetching raw material:", error);
    return NextResponse.json(
      { error: "خطا در دریافت ماده اولیه" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/raw-materials/[id]
 * Update raw material
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const material = rawMaterialsService.updateRawMaterial(params.id, body);

    return NextResponse.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error("Error updating raw material:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی ماده اولیه" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/raw-materials/[id]
 * Delete raw material
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireSuperAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const success = rawMaterialsService.deleteRawMaterial(params.id);

    if (!success) {
      return NextResponse.json(
        { error: "ماده اولیه یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ماده اولیه حذف شد"
    });
  } catch (error) {
    console.error("Error deleting raw material:", error);
    return NextResponse.json(
      { error: "خطا در حذف ماده اولیه" },
      { status: 500 }
    );
  }
}
