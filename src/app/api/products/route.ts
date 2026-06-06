import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth";
import * as productsService from "@/services/productsService";

// GET all products
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") as "raw_material" | "packed_product" | undefined;
    const products = productsService.getProducts(type);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const authErr = ensureAdmin(request);
    if (authErr) return authErr;

    const body = await request.json();

    const {
      name,
      type,
      category,
      unit,
      currentStock,
      minStock,
      price,
      supplier,
      lastRestocked
    } = body;

    if (!name || !type || !category || !unit) {
      return NextResponse.json(
        { error: "Name, type, category, and unit are required" },
        { status: 400 }
      );
    }

    if (type !== "raw_material" && type !== "packed_product") {
      return NextResponse.json(
        { error: "Type must be 'raw_material' or 'packed_product'" },
        { status: 400 }
      );
    }

    const product = productsService.createProduct({
      name,
      type,
      category,
      unit,
      currentStock: currentStock || 0,
      minStock: minStock || 0,
      price: price || 0,
      supplier: supplier || undefined,
      lastRestocked: lastRestocked || undefined
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
