import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth";
import * as productsService from "@/services/productsService";

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const product = productsService.getProduct(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authErr = ensureAdmin(request);
    if (authErr) return authErr;

    const { id } = await Promise.resolve(params);
    const body = await request.json();

    const product = productsService.updateProduct(id, body);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Product PUT error:", error);
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authErr = ensureAdmin(request);
    if (authErr) return authErr;

    const { id } = await Promise.resolve(params);

    // Check if product is used in any menu items
    const menuItems = productsService.getMenuItemsUsingProduct(id);
    if (menuItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete product that is used in menu items" },
        { status: 400 }
      );
    }

    const deleted = productsService.deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

