import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminSession,
  setAuthCookie,
} from "@/lib/authMiddleware";
import {
  hashPassword,
  updateUserPassword,
  getUserById,
  getUserByEmail,
} from "@/lib/authService";
import { validatePassword } from "@/utils/passwordValidation";

/**
 * Admin endpoint to change any user's password
 * POST /api/auth/admin/change-password
 * 
 * Request body:
 * {
 *   userId: string (ID of the user whose password to change)
 *   newPassword: string
 * }
 * 
 * OR use email instead of userId:
 * {
 *   userEmail: string (email of the user whose password to change)
 *   newPassword: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const { user: adminUser, error: authError } = validateAdminSession(request);

    if (authError) {
      return authError;
    }

    const { userId, userEmail, newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: "رمز عبور جدید الزامی است" },
        { status: 400 }
      );
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "شناسه یا ایمیل کاربر الزامی است" },
        { status: 400 }
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

    // Find the user
    let targetUser;
    if (userId) {
      targetUser = getUserById(userId);
    } else {
      targetUser = getUserByEmail(userEmail);
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Prevent changing own password via admin endpoint
    if ((adminUser as any).user_id === (targetUser as any).id) {
      return NextResponse.json(
        {
          error:
            "برای تغییر رمز عبور خود از بخش تغییر رمز عبور استفاده کنید",
        },
        { status: 400 }
      );
    }

    // Hash and update password
    const newPasswordHash = await hashPassword(newPassword);
    updateUserPassword((targetUser as any).id, newPasswordHash);

    return NextResponse.json(
      {
        success: true,
        message: "رمز عبور کاربر با موفقیت تغییر یافت",
        user: {
          id: (targetUser as any).id,
          email: (targetUser as any).email,
          name: (targetUser as any).name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}
