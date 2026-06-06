"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Coffee, Bell } from "lucide-react";
import { formatToman } from "@/utils/format";
import { timestampToJalaliString, formatPersianNumber } from "@/utils/dateConverter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  source: "website" | "manual";
  totalPrice?: number;
  createdAt?: number;
  updatedAt?: number;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
}

interface StaffOrdersViewProps {
  role: "waiter" | "barista" | "manager";
  isDark?: boolean;
}

export default function StaffOrdersView({ role, isDark = true }: StaffOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Order["status"] | "all">("all");
  const [lastNotificationCheck, setLastNotificationCheck] = useState<number>(
    Math.floor(Date.now() / 1000)
  );
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      // Create audio context for generating notification sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Higher pitch
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Return a simple object that can be used to play sound
        return {
          play: () => {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              
              osc.connect(gain);
              gain.connect(ctx.destination);
              
              osc.frequency.value = 800;
              osc.type = "sine";
              
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.5);
            } catch (e) {
              console.error("Audio play error:", e);
            }
          }
        };
      } catch (e) {
        console.error("Audio context creation error:", e);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 5 seconds
    const interval = setInterval(() => {
      fetchOrders();
      if (role === "waiter") {
        checkNotifications();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [role, filter]);

  const fetchOrders = async () => {
    try {
      const url = filter !== "all" ? `/api/staff/orders?status=${filter}` : "/api/staff/orders";
      const response = await fetch(url, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotifications = async () => {
    try {
      const response = await fetch(
        `/api/staff/notifications?since=${lastNotificationCheck}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.notifications && data.notifications.length > 0) {
          // Play sound notification (voice alarm)
          if (audio && audio.play) {
            // Play sound 3 times for better visibility
            audio.play();
            setTimeout(() => audio.play(), 200);
            setTimeout(() => audio.play(), 400);
          }

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            data.notifications.forEach((notif: any) => {
              new Notification(`🔔 سفارش آماده است`, {
                body: notif.message || `سفارش جدید آماده تحویل است`,
                icon: "/favicon.ico",
                tag: `order-${notif.order_id}`,
                requireInteraction: true,
              });
            });
          }

          // Mark notifications as read
          for (const notif of data.notifications) {
            fetch("/api/staff/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ notificationId: notif.id }),
            }).catch(console.error);
          }

          // Refresh orders to show new ready orders
          fetchOrders();
          
          setLastNotificationCheck(Math.floor(Date.now() / 1000));
        }
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        const error = await response.json();
        alert(error.error || "خطا در تغییر وضعیت سفارش");
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (role === "waiter") {
      requestNotificationPermission();
    }
  }, [role]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "preparing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "ready":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "completed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "preparing":
        return <Coffee size={16} />;
      case "ready":
        return <Bell size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "در انتظار";
      case "preparing":
        return "در حال آماده‌سازی";
      case "ready":
        return "آماده";
      case "completed":
        return "تکمیل شده";
      case "cancelled":
        return "لغو شده";
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={cn(
            filter === "all" && "bg-coffee-600 hover:bg-coffee-500"
          )}
        >
          همه
        </Button>
        {role !== "waiter" && (
          <>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              className={cn(
                filter === "pending" && "bg-yellow-600 hover:bg-yellow-500"
              )}
            >
              در انتظار
            </Button>
            <Button
              variant={filter === "preparing" ? "default" : "outline"}
              onClick={() => setFilter("preparing")}
              className={cn(
                filter === "preparing" && "bg-blue-600 hover:bg-blue-500"
              )}
            >
              در حال آماده‌سازی
            </Button>
          </>
        )}
        <Button
          variant={filter === "ready" ? "default" : "outline"}
          onClick={() => setFilter("ready")}
          className={cn(
            filter === "ready" && "bg-green-600 hover:bg-green-500"
          )}
        >
          آماده
        </Button>
        {role === "manager" && (
          <>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
            >
              تکمیل شده
            </Button>
            <Button
              variant={filter === "cancelled" ? "default" : "outline"}
              onClick={() => setFilter("cancelled")}
            >
              لغو شده
            </Button>
          </>
        )}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className={cn(isDark ? "bg-neutral-900 border-white/5" : "bg-white")}>
            <CardContent className="p-8 text-center text-gray-400">
              سفارشی یافت نشد
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={cn(
                isDark ? "bg-neutral-900 border-white/5" : "bg-white",
                order.status === "ready" && "ring-2 ring-green-500/50"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
                      سفارش #{toPersianDigits(order.id.slice(0, 8))}
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-1">
                      {order.tableNumber && `میز ${toPersianDigits(order.tableNumber.toString())} - `}
                      {order.customerName || "مشتری"}
                      {order.createdAt &&
                        ` - ${timestampToJalaliString(order.createdAt)}`}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-lg border flex items-center gap-2",
                      getStatusColor(order.status)
                    )}
                  >
                    {getStatusIcon(order.status)}
                    <span className="text-sm font-medium">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm"
                    >
                      <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                        {item.name} × {toPersianDigits(item.quantity.toString())}
                      </span>
                      <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                        {formatToman(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>
                    مجموع: {formatToman(order.totalPrice || 0)}
                  </span>
                  {role === "barista" && order.status === "pending" && (
                    <Button
                      onClick={() => handleStatusChange(order.id, "preparing")}
                      className="bg-blue-600 hover:bg-blue-500"
                    >
                      شروع آماده‌سازی
                    </Button>
                  )}
                  {role === "barista" && order.status === "preparing" && (
                    <Button
                      onClick={() => handleStatusChange(order.id, "ready")}
                      className="bg-green-600 hover:bg-green-500"
                    >
                      آماده است
                    </Button>
                  )}
                  {role === "waiter" && order.status === "ready" && (
                    <Button
                      onClick={async () => {
                        // Mark order as completed (waiter can only mark ready orders as completed)
                        try {
                          const response = await fetch(`/api/orders/${order.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ status: "completed" }),
                          });
                          if (response.ok) {
                            await fetchOrders();
                          } else {
                            const error = await response.json();
                            alert(error.error || "خطا در تغییر وضعیت سفارش");
                          }
                        } catch (error) {
                          console.error("Failed to complete order:", error);
                          alert("خطا در ارتباط با سرور");
                        }
                      }}
                      className="bg-coffee-600 hover:bg-coffee-500"
                    >
                      تحویل داده شد
                    </Button>
                  )}
                  {role === "manager" && (
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => handleStatusChange(order.id, "preparing")}
                          className="bg-blue-600 hover:bg-blue-500"
                          size="sm"
                        >
                          شروع آماده‌سازی
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          onClick={() => handleStatusChange(order.id, "ready")}
                          className="bg-green-600 hover:bg-green-500"
                          size="sm"
                        >
                          آماده است
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          onClick={() => handleStatusChange(order.id, "completed")}
                          className="bg-coffee-600 hover:bg-coffee-500"
                          size="sm"
                        >
                          تکمیل شد
                        </Button>
                      )}
                      {order.status !== "cancelled" && order.status !== "completed" && (
                        <Button
                          onClick={() => handleStatusChange(order.id, "cancelled")}
                          variant="destructive"
                          size="sm"
                        >
                          لغو
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

