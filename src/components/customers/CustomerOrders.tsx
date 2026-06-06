"use client";

import React, { useState, useEffect } from "react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  orders: Array<{
    id: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    status: "pending" | "completed" | "cancelled";
    totalPrice?: number;
    totalAmount?: number;
    createdAt: string;
  }>;
}

interface CustomerOrdersProps {
  orders: any[];
  isDark: boolean;
}

type SortOption = "orders" | "spent" | "name";

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ orders, isDark }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("orders");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // Group orders by customer
    const customerMap = new Map<string, Customer>();

    orders.forEach((order: any) => {
      const customerId = order.customerPhone || order.customerName || "anonymous";
      const customerName = order.customerName || "مشتری ناشناس";
      const customerPhone = order.customerPhone;

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          totalOrders: 0,
          totalSpent: 0,
          orders: []
        });
      }

      const customer = customerMap.get(customerId)!;
      customer.totalOrders += 1;
      customer.totalSpent += order.totalPrice || order.totalAmount || 0;
      customer.orders.push({
        id: order.id,
        items: order.items || [],
        status: order.status,
        totalPrice: order.totalPrice,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      });

      // Update last order date
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt).getTime();
        if (!customer.lastOrderDate || new Date(customer.lastOrderDate).getTime() < orderDate) {
          customer.lastOrderDate = order.createdAt;
        }
      }
    });

    setCustomers(Array.from(customerMap.values()));
  }, [orders]);

  const sortedCustomers = [...customers].sort((a, b) => {
    switch (sortBy) {
      case "orders":
        return b.totalOrders - a.totalOrders;
      case "spent":
        return b.totalSpent - a.totalSpent;
      case "name":
        return a.name.localeCompare(b.name, "fa");
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sort Controls */}
      <Card
        className={cn(
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={sortBy === "orders" ? "default" : "outline"}
              onClick={() => setSortBy("orders")}
              className={cn(
                sortBy === "orders"
                  ? "bg-coffee-600 text-white"
                  : isDark
                  ? "bg-neutral-800 text-gray-400 hover:text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              ترتیب بر اساس تعداد سفارشات
            </Button>
            <Button
              variant={sortBy === "spent" ? "default" : "outline"}
              onClick={() => setSortBy("spent")}
              className={cn(
                sortBy === "spent"
                  ? "bg-coffee-600 text-white"
                  : isDark
                  ? "bg-neutral-800 text-gray-400 hover:text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              ترتیب بر اساس مبلغ
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              onClick={() => setSortBy("name")}
              className={cn(
                sortBy === "name"
                  ? "bg-coffee-600 text-white"
                  : isDark
                  ? "bg-neutral-800 text-gray-400 hover:text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              ترتیب بر اساس نام
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="space-y-4">
        {sortedCustomers.map(customer => (
          <Card
            key={customer.id}
            className={cn(
              "overflow-hidden",
              isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
            )}
          >
            {/* Customer Header - Clickable */}
            <CardHeader
              onClick={() =>
                setExpandedCustomerId(
                  expandedCustomerId === customer.id ? null : customer.id
                )
              }
              className={cn(
                "cursor-pointer transition-colors",
                expandedCustomerId === customer.id
                  ? isDark
                    ? "bg-white/5"
                    : "bg-gray-50"
                  : isDark
                  ? "hover:bg-white/5"
                  : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <CardTitle
                      className={cn(
                        "text-xl font-bold",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    >
                      {customer.name}
                    </CardTitle>
                    {customer.phone && (
                      <span
                        className={cn(
                          "text-sm",
                          isDark ? "text-gray-400" : "text-gray-600"
                        )}
                      >
                        {customer.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span
                      className={cn(
                        isDark ? "text-primary-400" : "text-primary-600"
                      )}
                    >
                      {toPersianDigits(customer.totalOrders.toString())} سفارش
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        isDark ? "text-emerald-400" : "text-emerald-600"
                      )}
                    >
                      {formatToman(customer.totalSpent)}
                    </span>
                    {customer.lastOrderDate && (
                      <span
                        className={cn(
                          isDark ? "text-gray-400" : "text-gray-600"
                        )}
                      >
                        آخرین سفارش:{" "}
                        {(() => {
                          const timestamp = Math.floor(
                            new Date(customer.lastOrderDate).getTime() / 1000
                          );
                          return timestampToJalaliString(timestamp);
                        })()}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "text-2xl transition-transform",
                    expandedCustomerId === customer.id ? "rotate-180" : ""
                  )}
                >
                  ▼
                </div>
              </div>
            </CardHeader>

            {/* Expanded Orders List */}
            {expandedCustomerId === customer.id && (
              <CardContent
                className={cn(
                  "border-t pt-0",
                  isDark ? "border-white/5" : "border-gray-300"
                )}
              >
                {customer.orders && customer.orders.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {customer.orders.map(order => (
                      <Card
                        key={order.id}
                        className={cn(
                          isDark
                            ? "bg-neutral-800 border-white/5"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div
                                className={cn(
                                  "font-semibold mb-1",
                                  isDark ? "text-white" : "text-gray-900"
                                )}
                              >
                                سفارش #{order.id.slice(0, 8)}
                              </div>
                              <div
                                className={cn(
                                  "text-sm",
                                  isDark ? "text-gray-400" : "text-gray-600"
                                )}
                              >
                                {(() => {
                                  const timestamp = Math.floor(
                                    new Date(order.createdAt).getTime() / 1000
                                  );
                                  return timestampToJalaliString(timestamp);
                                })()}
                              </div>
                            </div>
                            <div className="text-left">
                              <div
                                className={cn(
                                  "font-bold text-lg",
                                  isDark ? "text-emerald-400" : "text-emerald-600"
                                )}
                              >
                                {formatToman(
                                  order.totalPrice || order.totalAmount || 0
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  order.status === "completed"
                                    ? "bg-green-500/20 text-green-400"
                                    : order.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                )}
                              >
                                {order.status === "completed"
                                  ? "تکمیل شده"
                                  : order.status === "pending"
                                  ? "در انتظار"
                                  : "لغو شده"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {order.items &&
                              order.items.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "text-sm flex justify-between",
                                    isDark ? "text-gray-300" : "text-gray-700"
                                  )}
                                >
                                  <span>
                                    {item.name} × {toPersianDigits(item.quantity.toString())}
                                  </span>
                                  <span>
                                    {formatToman(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "p-8 text-center",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    سفارشی برای این مشتری ثبت نشده است
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {sortedCustomers.length === 0 && (
          <Card
            className={cn(
              "text-center py-12",
              isDark
                ? "bg-neutral-900 border-white/5 text-gray-400"
                : "bg-white border-gray-300 text-gray-600"
            )}
          >
            <CardContent>
              هنوز مشتری‌ای ثبت نشده است
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;




