import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerBySession } from "@/lib/customerAuthService";
import { getDatabase } from "@/lib/database";
import { createOrUpdateCustomer } from "@/lib/customerOTPService";

const CUSTOMER_COOKIE_NAME = "customer_auth_token";

/**
 * Complete customer signup by adding name
 * This endpoint is used after OTP verification when customer doesn't have a name
 */
export async function POST(request: NextRequest) {
  try {
    // Try multiple methods to get the cookie
    let token: string | undefined;
    
    // Method 1: Next.js cookies() API
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
      if (token) console.log("Token found via cookies() API");
    } catch (e) {
      console.warn("Could not read cookies using cookies() API");
    }

    // Method 2: NextRequest.cookies
    if (!token) {
      token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
      if (token) console.log("Token found via request.cookies");
    }

    // Method 3: Parse from request headers
    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies[CUSTOMER_COOKIE_NAME];
        if (token) console.log("Token found via header parsing");
      }
    }

    if (!token) {
      console.error("No customer auth token found in cookies");
      console.error("Cookie header:", request.headers.get("cookie"));
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است. لطفا دوباره وارد شوید" },
        { status: 401 }
      );
    }

    console.log("Token found, verifying session...");

    // Verify session and get customer
    const customer = getCustomerBySession(token);
    if (!customer) {
      console.error("Failed to get customer from session");
      return NextResponse.json(
        { error: "جلسه منقضی شده است. لطفا دوباره وارد شوید" },
        { status: 401 }
      );
    }

    console.log("Session verified, customer ID:", customer.id);

    const { name, phoneNumber } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام الزامی است" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber?.replace(/\D/g, "") || customer.phoneNumber;

    // Update customer name (this ensures the customer record exists and name is set)
    const updatedCustomer = createOrUpdateCustomer(
      normalizedPhone,
      name.trim()
    );

    // Get full customer data
    const db = getDatabase();
    const fullCustomer = db
      .prepare(`SELECT id, phone, name FROM customers WHERE id = ?`)
      .get(updatedCustomer.id) as any;

    return NextResponse.json(
      {
        success: true,
        message: "ثبت‌نام با موفقیت انجام شد",
        customer: {
          id: fullCustomer.id,
          phoneNumber: fullCustomer.phone,
          name: fullCustomer.name
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Complete signup error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}

