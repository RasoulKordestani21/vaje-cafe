import { NextRequest, NextResponse } from "next/server";
import { getCustomerAuthToken, clearCustomerAuthCookie } from "@/lib/customerAuthMiddleware";
import { deleteCustomerSession } from "@/lib/customerAuthService";

export async function POST(request: NextRequest) {
  try {
    const token = getCustomerAuthToken(request);

    if (token) {
      // Delete session from database
      deleteCustomerSession(token);
    }

    // Clear cookie
    const response = NextResponse.json(
      { success: true, message: "خروج موفق" },
      { status: 200 }
    );

    return clearCustomerAuthCookie(response);
  } catch (error: any) {
    console.error("Customer logout error:", error);
    return NextResponse.json(
      { error: "خطای سرور" },
      { status: 500 }
    );
  }
}




