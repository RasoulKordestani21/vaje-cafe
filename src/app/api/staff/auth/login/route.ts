import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import {
  verifyStaffPassword,
  createStaffSession,
} from "@/lib/staffAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const staff = db
      .prepare("SELECT * FROM staff WHERE email = ? AND is_active = 1")
      .get(email) as any;

    if (!staff) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    const isValid = await verifyStaffPassword(
      password,
      staff.password_hash
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    const session = createStaffSession(staff.id);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        role: staff.role,
        branch_id: staff.branch_id,
      },
      token: session.token,
    });

    response.cookies.set("staff_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json(
      { error: "خطا در ورود" },
      { status: 500 }
    );
  }
}

