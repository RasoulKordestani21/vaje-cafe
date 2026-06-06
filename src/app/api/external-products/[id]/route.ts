import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import * as externalProductsService from "@/services/externalProductsService";

/**
 * GET /api/external-products/[id]
 * Get single external product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = externalProductsService.getExternalProduct(params.id);

    if (!product) {
      return NextResponse.json(
        { error: "محصول خارجی یافت نشد" },
        { status: 404 }
      );
    }

    // Only return if available or user is super admin
    const { user } = validateSession(request);
    if (!product.isAvailable && user?.role !== "super_admin") {
      return NextResponse.json(
        { error: "محصول در دسترس نیست" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Error fetching external product:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصول خارجی" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/external-products/[id]
 * Update external product (super admin only)
 */
export async function PUT(
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
    const product = externalProductsService.updateExternalProduct(
      params.id,
      body
    );

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Error updating external product:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی محصول خارجی" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/external-products/[id]
 * Delete external product (super admin only)
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

    const deleted = externalProductsService.deleteExternalProduct(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "محصول خارجی یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "محصول خارجی حذف شد"
    });
  } catch (error) {
    console.error("Error deleting external product:", error);
    return NextResponse.json(
      { error: "خطا در حذف محصول خارجی" },
      { status: 500 }
    );
  }
}
