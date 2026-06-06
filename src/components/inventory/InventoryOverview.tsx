"use client";

import React from "react";
import { AlertTriangle, Calculator, Store } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InventoryOverviewProps {
  lowStockCount: number;
  inventoryValue: {
    totalValue: number;
    rawMaterialsValue: number;
    packedProductsValue: number;
  } | null;
  suppliersCount: number;
  isDark: boolean;
}

const InventoryOverview: React.FC<InventoryOverviewProps> = ({
  lowStockCount,
  inventoryValue,
  suppliersCount,
  isDark
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Low Stock Alerts Card */}
      <Card
        className={cn(
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                lowStockCount > 0
                  ? "bg-red-900/30 text-red-500"
                  : "bg-green-900/30 text-green-500"
              )}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <p
                className={cn(
                  "text-sm mb-1",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}
              >
                هشدار موجودی کم
              </p>
              <h3
                className={cn(
                  "text-2xl font-bold font-serif",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {toPersianDigits(lowStockCount.toString())}
              </h3>
            </div>
          </div>
          {lowStockCount > 0 && (
            <p className={cn("text-xs", isDark ? "text-red-400" : "text-red-600")}>
              نیاز به سفارش مجدد
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Inventory Value Card */}
      <Card
        className={cn(
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isDark
                  ? "bg-emerald-900/30 text-emerald-500"
                  : "bg-emerald-100 text-emerald-600"
              )}
            >
              <Calculator size={24} />
            </div>
            <div>
              <p
                className={cn(
                  "text-sm mb-1",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}
              >
                ارزش کل موجودی
              </p>
              <h3
                className={cn(
                  "text-2xl font-bold font-serif",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {inventoryValue
                  ? formatToman(inventoryValue.totalValue)
                  : formatToman(0)}
              </h3>
            </div>
          </div>
          {inventoryValue && (
            <div className="flex gap-4 text-xs">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                مواد اولیه: {formatToman(inventoryValue.rawMaterialsValue)}
              </span>
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                بسته‌بندی: {formatToman(inventoryValue.packedProductsValue)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suppliers Count Card */}
      <Card
        className={cn(
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isDark
                  ? "bg-blue-900/30 text-blue-500"
                  : "bg-blue-100 text-blue-600"
              )}
            >
              <Store size={24} />
            </div>
            <div>
              <p
                className={cn(
                  "text-sm mb-1",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}
              >
                تعداد تامین‌کنندگان
              </p>
              <h3
                className={cn(
                  "text-2xl font-bold font-serif",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {toPersianDigits(suppliersCount.toString())}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryOverview;




