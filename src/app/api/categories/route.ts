import { NextRequest, NextResponse } from "next/server";
import * as categoriesService from "@/services/categoriesService";

/**
 * GET /api/categories
 * Hierarchical inventory category tree for admin product forms
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      tree: categoriesService.getCategoryTree(),
      data: categoriesService.getCategories(),
      groups: categoriesService.getCategoryGroups(),
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
 * POST /api/categories — categories are defined in system constants
 */
export async function POST() {
  return NextResponse.json(
    { error: "دسته‌بندی‌ها از طریق تنظیمات سیستم مدیریت می‌شوند" },
    { status: 405 }
  );
}
