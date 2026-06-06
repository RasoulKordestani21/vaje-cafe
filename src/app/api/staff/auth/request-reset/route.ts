import { NextRequest, NextResponse } from "next/server";
import {
  createStaffPasswordResetOTP,
  getStaffByEmail,
} from "@/lib/staffAuth";
import { sendOTPEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Staff password reset request for email:", email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل الزامی است" }, { status: 400 });
    }

    // Check if staff exists
    const staff = getStaffByEmail(email);

    // Generate OTP regardless of staff existence (for security)
    const { otp } = createStaffPasswordResetOTP(email);

    // Send OTP email only if staff exists
    console.log("Staff lookup result:", staff ? "Found" : "Not found");
    if (staff) {
      const emailSent = await sendOTPEmail({
        email,
        otp,
        name: staff.name,
      });
      console.log("Email sent status:", emailSent);

      if (!emailSent) {
        return NextResponse.json(
          { error: "خطا در ارسال ایمیل، لطفا دوباره امتحان کنید" },
          { status: 500 }
        );
      }
    } else {
      console.log("Staff not found for email:", email);
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json(
      {
        success: true,
        message: "اگر ایمیل در سیستم ثبت است، کد OTP برای شما ارسال خواهد شد",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Staff password reset request error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}



