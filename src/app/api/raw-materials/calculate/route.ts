import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import * as rawMaterialsService from "@/services/rawMaterialsService";

/**
 * GET /api/raw-materials/calculate
 * Calculate total raw material usage based on date range
 * Optional query params: startDate (timestamp), endDate (timestamp)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);

    if (error) {
      return error;
    }

    if (user?.role !== "super_admin") {
      return NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const usage = rawMaterialsService.calculateRawMaterialUsage(
      startDate ? parseInt(startDate) : undefined,
      endDate ? parseInt(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error("Error calculating raw material usage:", error);
    return NextResponse.json(
      { error: "خطا در محاسبه استفاده مواد اولیه" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/raw-materials/calculate/apply
 * Apply raw material usage (deduct stock) for a specific order
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);

    if (error) {
      return error;
    }

    if (user?.role !== "super_admin") {
      return NextResponse.json({ error: "شما دسترسی ندارید" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json(
        { error: "شناسه سفارش الزامی است" },
        { status: 400 }
      );
    }

    rawMaterialsService.applyRawMaterialUsageForOrder(body.orderId);

    return NextResponse.json({
      success: true,
      message: "استفاده مواد اولیه اعمال شد"
    });
  } catch (error) {
    console.error("Error applying raw material usage:", error);
    return NextResponse.json(
      { error: "خطا در اعمال استفاده مواد اولیه" },
      { status: 500 }
    );
  }
}
