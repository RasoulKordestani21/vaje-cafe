import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerOTP,
  markCustomerOTPAsUsed,
  createOrUpdateCustomer
} from "@/lib/customerOTPService";
import { createCustomerSession } from "@/lib/customerAuthService";
import { setCustomerAuthCookie } from "@/lib/customerAuthMiddleware";
import { getDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, name } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: "شماره موبایل و کد OTP الزامی است" },
        { status: 400 }
      );
    }

    // Validate OTP format (4 digits)
    const normalizedOtp = otp.replace(/\D/g, "");
    if (!/^\d{4}$/.test(normalizedOtp)) {
      return NextResponse.json(
        { error: "کد تأیید باید ۴ رقم باشد" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!/^(09|98)\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "فرمت شماره موبایل نامعتبر است" },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpRecord = verifyCustomerOTP(normalizedPhone, normalizedOtp);

    if (!otpRecord) {
      return NextResponse.json(
        { error: "کد OTP نامعتبر یا منقضی است" },
        { status: 400 }
      );
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "تعداد تلاش‌های نامعتبر زیاد است. لطفا کد جدید درخواست کنید" },
        { status: 429 }
      );
    }

    // Mark OTP as used
    markCustomerOTPAsUsed(otpRecord.id);

    // Check if this is login (existing customer with name) or signup (new customer or no name)
    const db = getDatabase();
    const existingCustomer = db
      .prepare(`SELECT id, phone, name FROM customers WHERE phone = ?`)
      .get(normalizedPhone) as any;

    const isLogin = existingCustomer && existingCustomer.name;
    const isSignup = !existingCustomer || !existingCustomer.name;

    // Create or update customer (update name if provided)
    const customer = createOrUpdateCustomer(
      normalizedPhone,
      name?.trim() || undefined
    );

    // Create customer session
    const { token, expiresAt } = createCustomerSession(customer.id);
    
    console.log("Session created for customer:", customer.id);
    console.log("Token:", token.substring(0, 10) + "...");
    console.log("Expires at:", new Date(expiresAt).toISOString());

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: isLogin ? "ورود موفق" : "کد تایید شد. لطفا نام خود را وارد کنید",
        isSignup: isSignup && !customer.name, // True if this is a signup flow
        customer: {
          id: customer.id,
          phoneNumber: customer.phoneNumber,
          name: customer.name
        },
        expiresAt
      },
      { status: 200 }
    );

    // Set customer auth cookie
    const finalResponse = setCustomerAuthCookie(response, token);
    console.log("Cookie set in response");
    return finalResponse;
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}

