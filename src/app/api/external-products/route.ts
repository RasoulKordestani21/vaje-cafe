import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import * as externalProductsService from "@/services/externalProductsService";

/**
 * GET /api/external-products
 * Get all external products (public - no auth check)
 */
export async function GET() {
  try {
    // For public access, fetch available products
    const products = externalProductsService.getAvailableExternalProducts();

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("Error fetching external products:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصولات خارجی" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/external-products
 * Create external product (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);

    if (error) {
      return error;
    }

    // Check if user is super admin
    if (user?.role !== "super_admin") {
      return NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.category ||
      !body.price === undefined ||
      !body.unit
    ) {
      return NextResponse.json(
        { error: "نام، دسته‌بندی، قیمت و واحد الزامی است" },
        { status: 400 }
      );
    }

    const product = externalProductsService.createExternalProduct({
      name: body.name,
      category: body.category,
      price: body.price,
      unit: body.unit,
      description: body.description,
      supplier: body.supplier,
      isAvailable: body.isAvailable !== false
    });

    return NextResponse.json(
      {
        success: true,
        data: product
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating external product:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد محصول خارجی" },
      { status: 500 }
    );
  }
}
