import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerBySession } from "@/lib/customerAuthService";
import { getDatabase } from "@/lib/database";

const CUSTOMER_COOKIE_NAME = "customer_auth_token";

// GET customer profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    const customer = getCustomerBySession(token);
    if (!customer) {
      return NextResponse.json(
        { error: "جلسه منقضی شده است" },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const fullCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customer.id) as any;

    return NextResponse.json({
      customer: {
        id: fullCustomer.id,
        name: fullCustomer.name,
        phoneNumber: fullCustomer.phone,
        email: fullCustomer.email,
        profilePicture: fullCustomer.profilePicture || null,
        totalOrders: fullCustomer.totalOrders || 0,
        totalSpent: fullCustomer.totalSpent || 0,
        lastOrderDate: fullCustomer.lastOrderDate
      }
    });
  } catch (error: any) {
    console.error("Get customer profile error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// PATCH update customer profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    const customer = getCustomerBySession(token);
    if (!customer) {
      return NextResponse.json(
        { error: "جلسه منقضی شده است" },
        { status: 401 }
      );
    }

    const { name, email } = await request.json();
    const db = getDatabase();

    // Update customer profile
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name?.trim() || null);
    }

    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email?.trim() || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "هیچ فیلدی برای به‌روزرسانی ارسال نشده است" },
        { status: 400 }
      );
    }

    updates.push("updatedAt = ?");
    values.push(Math.floor(Date.now() / 1000));
    values.push(customer.id);

    db.prepare(
      `UPDATE customers SET ${updates.join(", ")} WHERE id = ?`
    ).run(...values);

    // Get updated customer
    const updatedCustomer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customer.id) as any;

    return NextResponse.json({
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        phoneNumber: updatedCustomer.phone,
        email: updatedCustomer.email,
        profilePicture: updatedCustomer.profilePicture || null,
        totalOrders: updatedCustomer.totalOrders || 0,
        totalSpent: updatedCustomer.totalSpent || 0,
        lastOrderDate: updatedCustomer.lastOrderDate
      }
    });
  } catch (error: any) {
    console.error("Update customer profile error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

