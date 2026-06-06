"use client";

import React from "react";
import { toPersianDigits } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderBulkActionsProps {
  selectedCount: number;
  isDark: boolean;
  onCompleteSelected: () => Promise<void> | void;
  onCancelSelected: () => Promise<void> | void;
  onClearSelection: () => void;
}

const OrderBulkActions: React.FC<OrderBulkActionsProps> = ({
  selectedCount,
  isDark,
  onCompleteSelected,
  onCancelSelected,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border flex items-center justify-between",
        isDark
          ? "bg-coffee-900/20 border-coffee-500/30"
          : "bg-coffee-50 border-coffee-300"
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          {toPersianDigits(selectedCount.toString())} سفارش انتخاب شده
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onCompleteSelected}
          className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium"
        >
          تکمیل انتخاب شده‌ها
        </Button>
        <Button
          onClick={onCancelSelected}
          className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium"
        >
          لغو انتخاب شده‌ها
        </Button>
        <Button
          onClick={onClearSelection}
          variant="outline"
          className={cn(
            isDark
              ? "bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
              : "bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300"
          )}
        >
          لغو انتخاب
        </Button>
      </div>
    </div>
  );
};

export default OrderBulkActions;


