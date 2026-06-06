import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";

// GET customer loyalty points balance
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyCustomerAuth(request);
    
    if (!auth.authenticated || !auth.customer) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const customer = db.prepare(
      "SELECT loyalty_points_balance FROM customers WHERE id = ?"
    ).get(auth.customer.id) as any;

    return NextResponse.json({
      balance: customer?.loyalty_points_balance || 0,
      customer_id: auth.customer.id
    });
  } catch (error) {
    console.error("Loyalty balance GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty balance" },
      { status: 500 }
    );
  }
}



