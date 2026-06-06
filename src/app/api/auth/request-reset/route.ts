import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetOTP } from "@/lib/authService";
import { getUserByEmail } from "@/lib/authService";
import { sendOTPEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Request received for email:", email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل الزامی است" }, { status: 400 });
    }

    // Check if user exists
    const user = getUserByEmail(email);

    // Generate OTP regardless of user existence (for security)
    const { otp } = createPasswordResetOTP(email);

    // Send OTP email only if user exists
    console.log("user");
    if (user) {
      const emailSent = await sendOTPEmail({
        email,
        otp,
        name: user.name
      });
      console.log("Email sent status:", emailSent);

      if (!emailSent) {
        return NextResponse.json(
          { error: "خطا در ارسال ایمیل، لطفا دوباره امتحان کنید" },
          { status: 500 }
        );
      }
    } else {
      console.log("User not found for email:", email);
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json(
      {
        success: true,
        message: "اگر ایمیل در سیستم ثبت است، کد OTP برای شما ارسال خواهد شد"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request password reset error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}
