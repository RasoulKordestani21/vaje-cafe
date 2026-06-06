import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerBySession } from "@/lib/customerAuthService";
import { getDatabase } from "@/lib/database";

const CUSTOMER_COOKIE_NAME = "customer_auth_token";

export async function POST(request: NextRequest) {
  try {
    // Get customer auth token from cookies using Next.js cookies() API
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      console.error("No customer auth token found in cookies");
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    // Verify session and get customer
    const customer = getCustomerBySession(token);
    if (!customer) {
      console.error("Invalid or expired customer session");
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام الزامی است" },
        { status: 400 }
      );
    }

    // Update customer name
    const db = getDatabase();
    db.prepare(`UPDATE customers SET name = ?, updatedAt = ? WHERE id = ?`).run(
      name.trim(),
      Math.floor(Date.now() / 1000),
      customer.id
    );

    // Get updated customer
    const updatedCustomer = db
      .prepare(`SELECT id, phone, name FROM customers WHERE id = ?`)
      .get(customer.id) as any;

    return NextResponse.json(
      {
        success: true,
        message: "نام با موفقیت به‌روزرسانی شد",
        customer: {
          id: updatedCustomer.id,
          phoneNumber: updatedCustomer.phone,
          name: updatedCustomer.name
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update customer name error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}

