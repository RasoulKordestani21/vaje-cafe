import { NextRequest, NextResponse } from "next/server";
import * as categoriesService from "@/services/categoriesService";

/**
 * GET /api/categories/[id]
 * Get single category by composite id (group::sub)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const category = categoriesService.getCategory(id);

    if (!category) {
      return NextResponse.json(
        { error: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "خطا در دریافت دسته‌بندی" },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: "دسته‌بندی‌ها از طریق تنظیمات سیستم مدیریت می‌شوند" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "دسته‌بندی‌ها از طریق تنظیمات سیستم مدیریت می‌شوند" },
    { status: 405 }
  );
}
