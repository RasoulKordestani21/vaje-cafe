"use client";

import React from "react";
import { Store } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Supplier {
  name: string;
  productCount: number;
  totalValue: number;
}

interface SuppliersListProps {
  suppliers: Supplier[];
  selectedSupplier: string | null;
  onSelectSupplier: (supplierName: string | null) => void;
  isDark: boolean;
}

const SuppliersList: React.FC<SuppliersListProps> = ({
  suppliers,
  selectedSupplier,
  onSelectSupplier,
  isDark
}) => {
  if (suppliers.length === 0) return null;

  return (
    <Card
      className={cn(
        isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(
            "text-lg font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          مدیریت تامین‌کنندگان
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(supplier => (
            <div
              key={supplier.name}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-colors",
                selectedSupplier === supplier.name
                  ? isDark
                    ? "bg-coffee-900/30 border-coffee-500"
                    : "bg-coffee-100 border-coffee-500"
                  : isDark
                  ? "bg-neutral-800 border-white/5 hover:bg-neutral-700"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              )}
              onClick={() =>
                onSelectSupplier(
                  selectedSupplier === supplier.name ? null : supplier.name
                )
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <Store
                  size={18}
                  className={isDark ? "text-blue-400" : "text-blue-600"}
                />
                <span
                  className={cn(
                    "font-semibold",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {supplier.name}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    تعداد محصولات:
                  </span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {toPersianDigits(supplier.productCount.toString())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                    ارزش کل:
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    )}
                  >
                    {formatToman(supplier.totalValue)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuppliersList;




