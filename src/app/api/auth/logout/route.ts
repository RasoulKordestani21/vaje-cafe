import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/authService";
import { clearAuthCookie } from "@/lib/authMiddleware";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (token) {
      deleteSession(token);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "خروج موفق"
      },
      { status: 200 }
    );

    // Clear session cookie using helper
    return clearAuthCookie(response);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
