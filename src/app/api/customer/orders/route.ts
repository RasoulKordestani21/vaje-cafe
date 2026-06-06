import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerBySession } from "@/lib/customerAuthService";
import { getDatabase } from "@/lib/database";

const CUSTOMER_COOKIE_NAME = "customer_auth_token";

// GET customer's own orders
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
    const orders = db
      .prepare("SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC")
      .all(customer.id) as any[];

    const ordersWithItems = orders.map(order => {
      const items = db
        .prepare("SELECT * FROM order_items WHERE orderId = ?")
        .all(order.id);
      return {
        id: order.id,
        total: order.total,
        status: order.status,
        tableNumber: order.tableNumber,
        customerNote: order.customerNote,
        createdAt: order.createdAt,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error: any) {
    console.error("Get customer orders error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}



