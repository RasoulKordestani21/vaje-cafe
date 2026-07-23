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

    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return clearStaffAuthCookie(response);
  } catch (error) {
    console.error("Staff logout error:", error);
    return NextResponse.json(
      { error: "خطا در خروج" },
      { status: 500 }
    );
  }
}



