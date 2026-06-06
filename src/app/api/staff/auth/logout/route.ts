import { NextRequest, NextResponse } from "next/server";
import { deleteStaffSession } from "@/lib/staffAuth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("staff_token")?.value;

    if (token) {
      deleteStaffSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("staff_token");
    return response;
  } catch (error) {
    console.error("Staff logout error:", error);
    return NextResponse.json(
      { error: "خطا در خروج" },
      { status: 500 }
    );
  }
}



