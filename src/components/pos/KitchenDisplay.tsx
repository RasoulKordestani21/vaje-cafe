"use client";

import React, { useState, useEffect } from "react";
import { Check, Clock, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { timestampToJalali } from "@/utils/jalaliDateUtils";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tableNumber: number | null;
  status: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
  note?: string;
  customerName?: string;
}

interface KitchenDisplayProps {
  isDark?: boolean;
}

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ isDark = true }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders?status=pending");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: "completed" | "cancelled") => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      } else {
        alert("خطا در بروزرسانی وضعیت سفارش");
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("خطا در بروزرسانی وضعیت سفارش");
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-neutral-950" : "bg-gray-50")}>
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-6", isDark ? "bg-neutral-950" : "bg-gray-50")} dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={cn("text-4xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          نمایش آشپزخانه (KDS)
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            className={cn(
              autoRefresh
                ? "bg-coffee-600 text-white"
                : isDark
                ? "bg-neutral-800 text-gray-300 border-neutral-700"
                : "bg-white text-gray-700 border-gray-300"
            )}
          >
            <RefreshCw size={18} className={cn("ml-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? "خودکار روشن" : "خودکار خاموش"}
          </Button>
          <Button
            onClick={fetchOrders}
            variant="outline"
            className={cn(
              isDark
                ? "bg-neutral-800 text-gray-300 border-neutral-700"
                : "bg-white text-gray-700 border-gray-300"
            )}
          >
            <RefreshCw size={18} className="ml-2" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Clock size={64} className="mx-auto mb-4 opacity-30" style={{ color: isDark ? "#fff" : "#000" }} />
          <p className={cn("text-2xl", isDark ? "text-gray-400" : "text-gray-600")}>
            سفارش در انتظاری وجود ندارد
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={cn(
                "relative overflow-hidden",
                isDark
                  ? "bg-neutral-900 border-white/10 hover:border-coffee-500/50"
                  : "bg-white border-gray-200 hover:border-coffee-500"
              )}
            >
              <CardContent className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {order.tableNumber && (
                        <span className={cn(
                          "px-3 py-1 rounded-full text-sm font-bold",
                          isDark
                            ? "bg-coffee-900/50 text-coffee-300"
                            : "bg-coffee-100 text-coffee-700"
                        )}>
                          میز {toPersianDigits(order.tableNumber.toString())}
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                      )}>
                        <Clock size={12} className="inline ml-1" />
                        در انتظار
                      </span>
                    </div>
                    {order.customerName && (
                      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                        {order.customerName}
                      </p>
                    )}
                    <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>
                      {formatJalaliDate(timestampToJalali(parseInt(order.createdAt)))}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex justify-between items-center p-2 rounded",
                        isDark ? "bg-neutral-800" : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          isDark
                            ? "bg-coffee-900/50 text-coffee-300"
                            : "bg-coffee-100 text-coffee-700"
                        )}>
                          {toPersianDigits(item.quantity.toString())}
                        </span>
                        <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {item.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Note */}
                {order.note && (
                  <div className={cn(
                    "mb-4 p-2 rounded text-sm italic",
                    isDark ? "bg-neutral-800 text-gray-300" : "bg-gray-50 text-gray-600"
                  )}>
                    {order.note}
                  </div>
                )}

                {/* Total */}
                <div className={cn(
                  "flex justify-between items-center mb-4 pb-4 border-b",
                  isDark ? "border-white/10" : "border-gray-200"
                )}>
                  <span className={cn("font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
                    مجموع:
                  </span>
                  <span className={cn("text-lg font-bold", isDark ? "text-coffee-400" : "text-coffee-600")}>
                    {formatToman(order.totalPrice)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateOrderStatus(order.id, "completed")}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                  >
                    <Check size={18} className="ml-2" />
                    تکمیل شد
                  </Button>
                  <Button
                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                    variant="outline"
                    className={cn(
                      "flex-1",
                      isDark
                        ? "bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/50"
                        : "bg-red-50 text-red-600 border-red-300 hover:bg-red-100"
                    )}
                  >
                    <X size={18} className="ml-2" />
                    لغو
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;



