import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/authService";
import { clearAuthCookie } from "@/lib/authMiddleware";
import { deleteStaffSession } from "@/lib/staffAuth";
import { clearStaffAuthCookie } from "@/lib/staffAuthMiddleware";

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth_token")?.value;
    const staffToken = request.cookies.get("staff_token")?.value;

    if (authToken) {
      deleteSession(authToken);
    }

    if (staffToken) {
      deleteStaffSession(staffToken);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "خروج موفق"
      },
      { status: 200 }
    );

    clearAuthCookie(response);
    return clearStaffAuthCookie(response);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
