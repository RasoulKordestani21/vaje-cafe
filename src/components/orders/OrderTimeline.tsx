"use client";

import React, { useState, useEffect } from "react";
import { Clock, User, CheckCircle, Coffee, Bell, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { timestampToJalaliString } from "@/utils/dateFormatter";

interface StatusHistory {
  id: string;
  order_id: string;
  status: string;
  changed_by_type: "admin" | "staff" | "system";
  changed_by_id: string | null;
  changed_by_name: string | null;
  note: string | null;
  created_at: number;
  createdAt?: string;
}

interface OrderTimelineProps {
  orderId: string;
  isDark?: boolean;
}

export default function OrderTimeline({ orderId, isDark = true }: OrderTimelineProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [orderId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/history`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch order history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} className="text-yellow-400" />;
      case "preparing":
        return <Coffee size={16} className="text-blue-400" />;
      case "ready":
        return <Bell size={16} className="text-green-400" />;
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "cancelled":
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "در انتظار",
      preparing: "در حال آماده‌سازی",
      ready: "آماده",
      completed: "تکمیل شده",
      cancelled: "لغو شده",
    };
    return labels[status] || status;
  };

  const getChangedByLabel = (item: StatusHistory) => {
    if (item.changed_by_type === "admin") {
      return `توسط ادمین: ${item.changed_by_name || "نامشخص"}`;
    } else if (item.changed_by_type === "staff") {
      return `توسط کارمند: ${item.changed_by_name || "نامشخص"}`;
    }
    return "سیستم";
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-400">
        در حال بارگذاری...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        تاریخچه‌ای ثبت نشده است
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-3 pb-3",
            index !== history.length - 1 && "border-b border-white/5"
          )}
        >
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            item.status === "pending" && "bg-yellow-500/20",
            item.status === "preparing" && "bg-blue-500/20",
            item.status === "ready" && "bg-green-500/20",
            item.status === "completed" && "bg-green-600/20",
            item.status === "cancelled" && "bg-red-500/20"
          )}>
            {getStatusIcon(item.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-sm font-medium",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {getStatusLabel(item.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <User size={12} />
              <span>{getChangedByLabel(item)}</span>
            </div>
            {item.createdAt && (
              <div className="text-xs text-gray-500 mt-1">
                {timestampToJalaliString(
                  typeof item.created_at === "number" 
                    ? item.created_at 
                    : Math.floor(new Date(item.createdAt).getTime() / 1000)
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}



