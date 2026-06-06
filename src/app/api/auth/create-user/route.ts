import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  createAdminUser,
  hashPassword
} from "@/lib/authService";
import { sendWelcomeEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "شما وارد سیستم نشده‌اید" },
        { status: 401 }
      );
    }

    // Verify session
    const session = verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { error: "جلسه منقضی شده است" },
        { status: 401 }
      );
    }

    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "ایمیل، نام و رمز عبور الزامی هستند" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return NextResponse.json(
        {
          error: "رمز عبور باید حداقل 8 کاراکتر بوده و شامل حروف و اعداد باشد"
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = createAdminUser(email, passwordHash, name);

    // Send welcome email
    await sendWelcomeEmail({
      email,
      name
    });

    return NextResponse.json(
      {
        success: true,
        message: "کاربر مدیریتی با موفقیت ایجاد شد",
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin user error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}
