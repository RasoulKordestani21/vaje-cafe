"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { toPersianDigits } from "@/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier?: string;
  stockPercentage?: number;
}

interface LowStockAlertsProps {
  alerts: LowStockAlert[];
  isDark: boolean;
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ alerts, isDark }) => {
  if (alerts.length === 0) return null;

  return (
    <Card
      className={cn(
        isDark
          ? "bg-red-900/10 border-red-500/30"
          : "bg-red-50 border-red-300"
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          <CardTitle
            className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            هشدار موجودی کم ({toPersianDigits(alerts.length.toString())} مورد)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.slice(0, 6).map(alert => (
            <div
              key={alert.productId}
              className={cn(
                "p-4 rounded-lg border",
                isDark
                  ? "bg-neutral-800 border-red-500/30"
                  : "bg-white border-red-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "font-semibold",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {alert.productName}
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    (alert.stockPercentage ?? 0) < 25
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  )}
                >
                  {(alert.stockPercentage ?? 0) < 25 ? "بحرانی" : "کم"}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    موجودی:
                  </span>
                  <span className={isDark ? "text-red-400" : "text-red-600"}>
                    {toPersianDigits(alert.currentStock.toString())} {alert.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    حداقل:
                  </span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {toPersianDigits(alert.minStock.toString())} {alert.unit}
                  </span>
                </div>
                {alert.supplier && (
                  <div className="flex justify-between">
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                      تامین‌کننده:
                    </span>
                    <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                      {alert.supplier}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {alerts.length > 6 && (
          <p
            className={cn(
              "text-sm mt-4 text-center",
              isDark ? "text-gray-400" : "text-gray-600"
            )}
          >
            و {toPersianDigits((alerts.length - 6).toString())} مورد دیگر...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockAlerts;




