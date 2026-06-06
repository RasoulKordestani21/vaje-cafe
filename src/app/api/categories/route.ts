import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import * as categoriesService from "@/services/categoriesService";

/**
 * GET /api/categories
 * Get all raw material categories (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const categories = categoriesService.getCategories();

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "خطا در دریافت دسته‌بندی‌ها" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create new category
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

    if (!body.name) {
      return NextResponse.json(
        { error: "نام دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }

    const category = categoriesService.createCategory(
      body.name,
      body.description,
      body.color
    );

    return NextResponse.json(
      {
        success: true,
        data: category
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد دسته‌بندی" },
      { status: 500 }
    );
  }
}
