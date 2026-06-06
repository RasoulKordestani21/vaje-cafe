import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerAuth } from "@/lib/customerAuthMiddleware";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyCustomerAuth(request);

    if (!authResult.authenticated || !authResult.customer) {
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        customer: authResult.customer
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Customer validation error:", error);
    return NextResponse.json(
      { error: "خطای سرور" },
      { status: 500 }
    );
  }
}




