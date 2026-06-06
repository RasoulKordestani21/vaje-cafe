"use client";

import React from "react";
import { X } from "lucide-react";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { toPersianDigits } from "@/utils/format";

interface InventoryLog {
  id: string;
  productId: string;
  changeType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  note?: string;
  createdAt: number;
}

interface InventoryLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: InventoryLog[];
  productName: string;
  isDark: boolean;
}

export const InventoryLogsModal: React.FC<InventoryLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  productName,
  isDark
}) => {
  if (!isOpen) return null;

  const bgClass = isDark ? "bg-neutral-900" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const borderClass = isDark ? "border-white/10" : "border-gray-300";

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case "order_consumed":
        return "مصرف سفارش";
      case "manual_add":
        return "افزودن دستی";
      case "manual_remove":
        return "کاهش دستی";
      case "restock":
        return "تامین مجدد";
      case "adjustment":
        return "تنظیم";
      default:
        return type;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "order_consumed":
        return "text-red-400";
      case "manual_add":
      case "restock":
        return "text-green-400";
      case "manual_remove":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className={`${bgClass} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border ${borderClass}`}
      >
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${borderClass} ${bgClass}`}>
          <div>
            <h2 className={`text-2xl font-bold ${textClass}`}>تاریخچه موجودی</h2>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition"
          >
            <X size={24} className="text-red-500" />
          </button>
        </div>

        {/* Logs List */}
        <div className="p-6">
          {logs.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              هیچ لاگی ثبت نشده است
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${borderClass} ${
                    isDark ? "bg-neutral-800" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${getChangeTypeColor(log.changeType)}`}>
                        {getChangeTypeLabel(log.changeType)}
                      </span>
                      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {timestampToJalaliString(log.createdAt)}
                      </span>
                    </div>
                    <div className={`font-bold ${log.quantity < 0 ? "text-red-400" : "text-green-400"}`}>
                      {log.quantity > 0 ? "+" : ""}
                      {toPersianDigits(log.quantity.toFixed(2))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                      قبل: {toPersianDigits(log.previousStock.toFixed(2))}
                    </span>
                    <span>→</span>
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                      بعد: {toPersianDigits(log.newStock.toFixed(2))}
                    </span>
                  </div>
                  {log.note && (
                    <div className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {log.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

