import { NextRequest, NextResponse } from "next/server";
import { createCustomerOTP, sendCustomerOTPSMS, createOrUpdateCustomer } from "@/lib/customerOTPService";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, name } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "شماره موبایل الزامی است" }, { status: 400 });
    }

    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!/^(09|98)\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "فرمت شماره موبایل نامعتبر است. لطفاً شماره را به صورت ۰۹xxxxxxxxx وارد کنید" },
        { status: 400 }
      );
    }

    // Ensure customer record exists
    createOrUpdateCustomer(normalizedPhone, name?.trim() || undefined);

    // Generate OTP (returns test OTP when KAVENEGAR_API_KEY is not set)
    let otp: string;
    let expiresAt: number;

    try {
      ({ otp, expiresAt } = createCustomerOTP(normalizedPhone));
    } catch (err: any) {
      if (err.message.includes("تعداد درخواست")) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      throw err;
    }

    const isTestOTP = otp === "1234";
    const isDev     = process.env.NODE_ENV === "development";
    const hasKey    = !!process.env.KAVENEGAR_API_KEY;

    // Skip real SMS in dev or when using the fallback test OTP
    if (!isTestOTP && hasKey) {
      const smsResult = await sendCustomerOTPSMS(normalizedPhone, otp);

      if (!smsResult.success) {
        console.error("[OTP] SMS failed:", smsResult.error);
        return NextResponse.json(
          { error: smsResult.error || "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید." },
          { status: 500 }
        );
      }
    }

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      message: isTestOTP ? "کد ورود تست: 1234" : "کد ورود به شماره شما ارسال شد",
      expiresAt,
    };

    // Expose OTP only in dev mode (never in production with a real key)
    if (isDev || isTestOTP) {
      response.otp = "1234"; // always show the unpadded form in UI hint
    }

    return NextResponse.json(response, { status: 200 });

  } catch (err: any) {
    console.error("[request-otp]", err);
    return NextResponse.json(
      { error: err.message || "خطای سرور، لطفاً دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}
