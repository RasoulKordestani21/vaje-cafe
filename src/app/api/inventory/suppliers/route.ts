import { NextRequest, NextResponse } from "next/server";
import { getSuppliers, getProductsBySupplier } from "@/services/inventoryService";

export async function GET(request: NextRequest) {
  try {
    const supplier = request.nextUrl.searchParams.get("supplier");
    
    if (supplier) {
      // Get products for specific supplier
      const products = getProductsBySupplier(supplier);
      return NextResponse.json(products);
    }
    
    // Get all suppliers
    const suppliers = getSuppliers();
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}




