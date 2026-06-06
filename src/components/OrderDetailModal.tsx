"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Phone, Mail, MapPin, FileText, Clock } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import OrderTimeline from "@/components/orders/OrderTimeline";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: "pending" | "completed" | "cancelled";
  source: "website" | "manual";
  totalAmount?: number;
  totalPrice?: number;
  created_at?: number;
  createdAt?: string | number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: number;
  note?: string;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  isDark?: boolean;
  showTimeline?: boolean;
}

export default function OrderDetailModal({
  isOpen,
  order,
  onClose,
  isDark = true,
  showTimeline = false
}: OrderDetailModalProps) {
  const [timelineEnabled, setTimelineEnabled] = useState(showTimeline);

  useEffect(() => {
    // Fetch timeline setting from site settings
    const fetchTimelineSetting = async () => {
      try {
        const response = await fetch("/api/settings/public");
        if (response.ok) {
          const data = await response.json();
          const showTimelineSetting = data.settings?.show_order_timeline === "true";
          setTimelineEnabled(showTimelineSetting || showTimeline);
        }
      } catch (error) {
        console.error("Failed to fetch timeline setting:", error);
        setTimelineEnabled(showTimeline);
      }
    };
    fetchTimelineSetting();
  }, [showTimeline]);

  if (!isOpen || !order) return null;

  const getOrderDate = () => {
    if (order.created_at) {
      return timestampToJalaliString(order.created_at);
    }
    if (order.createdAt) {
      const timestamp = typeof order.createdAt === "string"
        ? Math.floor(new Date(order.createdAt).getTime() / 1000)
        : order.createdAt;
      return timestampToJalaliString(timestamp);
    }
    return "نامشخص";
  };

  const getTotalAmount = () => {
    return order.totalAmount || order.totalPrice || 0;
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "درحال انتظار";
      case "completed":
        return "تکمیل شده";
      case "cancelled":
        return "لغو شده";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl ${
          isDark
            ? "bg-neutral-900 border-white/10"
            : "bg-white border-gray-300"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-6 border-b ${
            isDark ? "border-white/10 bg-neutral-900" : "border-gray-300 bg-white"
          }`}
        >
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            جزئیات سفارش
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-neutral-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border ${
                isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className={isDark ? "text-gray-400" : "text-gray-600"} />
                <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  تاریخ سفارش
                </span>
              </div>
              <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {getOrderDate()}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className={isDark ? "text-gray-400" : "text-gray-600"} />
                <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  شماره سفارش
                </span>
              </div>
              <p className={`font-semibold font-mono ${isDark ? "text-white" : "text-gray-900"}`}>
                #{order.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div
            className={`p-4 rounded-lg border ${
              isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
            }`}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              اطلاعات مشتری
            </h3>
            <div className="space-y-3">
              {order.customerName && (
                <div className="flex items-center gap-3">
                  <User size={18} className={isDark ? "text-gray-400" : "text-gray-600"} />
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {order.customerName}
                  </span>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className={isDark ? "text-gray-400" : "text-gray-600"} />
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {order.customerPhone}
                  </span>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className={isDark ? "text-gray-400" : "text-gray-600"} />
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {order.customerEmail}
                  </span>
                </div>
              )}
              {order.tableNumber && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className={isDark ? "text-gray-400" : "text-gray-600"} />
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    میز شماره {toPersianDigits(order.tableNumber.toString())}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              آیتم‌های سفارش
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDark
                      ? "bg-neutral-800 border-white/5"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark
                          ? "bg-neutral-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {toPersianDigits((index + 1).toString())}
                    </span>
                    <div>
                      <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {item.name}
                      </p>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {toPersianDigits(item.quantity.toString())} عدد × {formatToman(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                    {formatToman(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Note */}
          {order.note && (
            <div
              className={`p-4 rounded-lg border ${
                isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
            >
              <h4 className={`text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                یادداشت سفارش
              </h4>
              <p className={isDark ? "text-white" : "text-gray-900"}>{order.note}</p>
            </div>
          )}

          {/* Order Summary */}
          <div
            className={`p-4 rounded-lg border ${
              isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                وضعیت سفارش
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                منبع سفارش
              </span>
              <span
                className={`text-sm font-semibold ${
                  order.source === "manual"
                    ? "text-primary-400"
                    : "text-blue-400"
                }`}
              >
                {order.source === "manual" ? "دستی" : "وب‌سایت"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                مبلغ کل
              </span>
              <span className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                {formatToman(getTotalAmount())}
              </span>
            </div>
          </div>

          {/* Order Timeline */}
          {timelineEnabled && (
            <div
              className={`p-4 rounded-lg border ${
                isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className={isDark ? "text-gray-400" : "text-gray-600"} />
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  تاریخچه وضعیت سفارش
                </h3>
              </div>
              <OrderTimeline orderId={order.id} isDark={isDark} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


