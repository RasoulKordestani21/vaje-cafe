import { NextRequest, NextResponse } from "next/server";
import {
  validateSession,
} from "@/lib/authMiddleware";
import {
  verifyPassword,
  hashPassword,
  updateUserPassword
} from "@/lib/authService";
import { validatePassword } from "@/utils/passwordValidation";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const { user: sessionUser, error: authError } = validateSession(request);

    if (authError) {
      return authError;
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "رمز عبور فعلی و جدید الزامی هستند" },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      (sessionUser as any).password_hash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "رمز عبور فعلی اشتباه است" },
        { status: 401 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: "رمز عبور معیارهای امنیتی را برآورده نمی‌کند",
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    updateUserPassword((sessionUser as any).user_id, newPasswordHash);

    return NextResponse.json(
      {
        success: true,
        message: "رمز عبور با موفقیت تغییر یافت"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}
