import { NextRequest, NextResponse } from "next/server";
import {
  verifyStaffOTP,
  markStaffOTPAsUsed,
  updateStaffPasswordByEmail,
  hashStaffPassword,
} from "@/lib/staffAuth";
import { validatePassword } from "@/utils/passwordValidation";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    console.log("Staff password reset request for email:", email, "OTP:", otp);

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی هستند" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "فرمت ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "کد OTP باید ۶ رقم باشد" },
        { status: 400 }
      );
    }

    // Validate OTP
    const otpRecord = verifyStaffOTP(email, otp);
    console.log("OTP verification result:", otpRecord ? "VALID" : "INVALID");

    if (!otpRecord) {
      return NextResponse.json(
        { error: "کد OTP نامعتبر یا منقضی است" },
        { status: 400 }
      );
    }

    // Check if too many attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { error: "تعداد تلاش‌های نامعتبر زیاد است. لطفا کد جدید درخواست کنید" },
        { status: 429 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: "رمز عبور معیارهای امنیتی را برآورده نمی‌کند",
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashStaffPassword(newPassword);

    // Update password
    updateStaffPasswordByEmail(email, passwordHash);

    // Mark OTP as used
    markStaffOTPAsUsed(otpRecord.id);

    return NextResponse.json(
      {
        success: true,
        message: "رمز عبور با موفقیت تغییر یافت. لطفا وارد سیستم شوید",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Staff password reset error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}



