"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShoppingBag, RotateCcw } from "lucide-react";
import { formatToman } from "@/utils/format";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PreviousOrder {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  createdAt: string;
  tableNumber?: number;
}

interface PreviousOrdersProps {
  customerId: string;
  isDark?: boolean;
}

const PreviousOrders: React.FC<PreviousOrdersProps> = ({
  customerId,
  isDark = true
}) => {
  const [orders, setOrders] = useState<PreviousOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (!customerId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/customers/${customerId}/orders`, {
          credentials: "include"
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("لطفا ابتدا وارد شوید");
            return;
          }
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        console.error("Error fetching previous orders:", err);
        setError("خطا در بارگذاری سفارشات قبلی");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customerId]);

  const handleReorder = (order: PreviousOrder) => {
    // Add all items from the order to cart
    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addItem(item.menuItemId, 1);
      }
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "در انتظار",
      completed: "تکمیل شده",
      cancelled: "لغو شده"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      completed: "bg-green-500/20 text-green-400",
      cancelled: "bg-red-500/20 text-red-400"
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  if (loading) {
    return (
      <div className={cn("p-6 rounded-xl", isDark ? "bg-neutral-900/50" : "bg-gray-50")}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-coffee-500/30 border-t-coffee-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-6 rounded-xl", isDark ? "bg-neutral-900/50" : "bg-gray-50")}>
        <p className={cn("text-center", isDark ? "text-gray-400" : "text-gray-600")}>
          {error}
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={cn("p-6 rounded-xl border", isDark ? "bg-neutral-900/50 border-white/5" : "bg-gray-50 border-gray-200")}>
        <div className="text-center py-8">
          <ShoppingBag
            size={48}
            className={cn("mx-auto mb-4", isDark ? "text-gray-600" : "text-gray-400")}
          />
          <p className={cn("text-lg font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
            سفارش قبلی ندارید
          </p>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            پس از ثبت اولین سفارش، می‌توانید آن را دوباره سفارش دهید
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", isDark ? "text-white" : "text-gray-900")}>
      <h3 className={cn("text-xl font-bold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
        <Clock size={20} className="text-coffee-500" />
        سفارشات قبلی
      </h3>
      
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className={cn(
              "rounded-xl border p-4 transition-all hover:shadow-lg",
              isDark
                ? "bg-neutral-900/50 border-white/5 hover:border-coffee-500/30"
                : "bg-white border-gray-200 hover:border-coffee-500/50"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getStatusColor(order.status))}>
                    {getStatusLabel(order.status)}
                  </span>
                  {order.tableNumber && (
                    <span className={cn("text-xs px-2 py-1 rounded-full", isDark ? "bg-neutral-800 text-gray-400" : "bg-gray-100 text-gray-600")}>
                      میز {order.tableNumber}
                    </span>
                  )}
                </div>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-left">
                <p className={cn("text-lg font-bold", isDark ? "text-coffee-400" : "text-coffee-600")}>
                  {formatToman(order.totalPrice)}
                </p>
              </div>
            </div>

            <div className={cn("mb-3 space-y-1", isDark ? "border-t border-white/5 pt-3" : "border-t border-gray-200 pt-3")}>
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                    {item.name} × {item.quantity}
                  </span>
                  <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                    {formatToman(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className={cn("text-xs mt-2", isDark ? "text-gray-500" : "text-gray-500")}>
                  + {order.items.length - 3} مورد دیگر
                </p>
              )}
            </div>

            <button
              onClick={() => handleReorder(order)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-medium",
                isDark
                  ? "bg-coffee-600 hover:bg-coffee-500 text-white"
                  : "bg-coffee-600 hover:bg-coffee-700 text-white"
              )}
            >
              <RotateCcw size={18} />
              سفارش مجدد
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousOrders;



