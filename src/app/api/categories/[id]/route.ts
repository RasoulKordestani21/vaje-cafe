import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import * as categoriesService from "@/services/categoriesService";

/**
 * GET /api/categories/[id]
 * Get single category
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

    const category = categoriesService.getCategory(params.id);

    if (!category) {
      return NextResponse.json(
        { error: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "خطا در دریافت دسته‌بندی" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]
 * Update category
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
    const category = categoriesService.updateCategory(params.id, body);

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی دسته‌بندی" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete category
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

    const success = categoriesService.deleteCategory(params.id);

    if (!success) {
      return NextResponse.json(
        { error: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "دسته‌بندی حذف شد"
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "خطا در حذف دسته‌بندی" },
      { status: 500 }
    );
  }
}
