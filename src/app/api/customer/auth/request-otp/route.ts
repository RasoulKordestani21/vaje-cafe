import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerOTP,
  sendCustomerOTPSMS,
  createOrUpdateCustomer
} from "@/lib/customerOTPService";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, name } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است" },
        { status: 400 }
      );
    }

    // Validate phone number format (Iranian mobile: 09xxxxxxxxx)
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!/^(09|98)\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "فرمت شماره موبایل نامعتبر است. لطفا شماره را به صورت 09xxxxxxxxx وارد کنید" },
        { status: 400 }
      );
    }

    // Create or update customer record (if name provided)
    if (name && name.trim()) {
      createOrUpdateCustomer(normalizedPhone, name.trim());
    } else {
      createOrUpdateCustomer(normalizedPhone);
    }

    // Generate OTP
    let otp: string;
    let expiresAt: number;

    try {
      const otpResult = createCustomerOTP(normalizedPhone);
      otp = otpResult.otp;
      expiresAt = otpResult.expiresAt;
    } catch (error: any) {
      if (error.message.includes("تعداد درخواست")) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
      throw error;
    }

    // Send OTP via SMS (skip if using test OTP)
    if (otp !== "001234") {
      const smsResult = await sendCustomerOTPSMS(normalizedPhone, otp);

      if (!smsResult.success) {
        // If SMS fails but we're in development or using test OTP, still return success
        if (process.env.NODE_ENV === "development" || !process.env.KAVENEGAR_API_KEY) {
          return NextResponse.json(
            {
              success: true,
              message: "کد OTP ایجاد شد (حالت تست)",
              otp: "1234", // Return unpadded version for display
              expiresAt
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          { error: smsResult.error || "خطا در ارسال پیامک" },
          { status: 500 }
        );
      }
    }

    // Always return OTP in response for testing (especially when using test OTP)
    const response: any = {
      success: true,
      message: otp === "001234" 
        ? "کد ورود تست: 1234" 
        : "کد ورود برای شما ارسال شد",
      expiresAt
    };

    // Always return OTP for testing (especially when Kavenegar is not configured)
    if (!process.env.KAVENEGAR_API_KEY || process.env.NODE_ENV === "development" || otp === "001234") {
      response.otp = "1234"; // Return unpadded version for display
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Request OTP error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}

