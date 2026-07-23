"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import {
  adminCard,
  adminMutedSurface,
  adminTextMuted,
  adminTextPrimary,
  adminTextSecondary,
} from "@/lib/adminTheme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterLogsByTab,
  getChangeTypeLabel,
  getLogCategory,
  isLogIncrease,
  type InventoryLogRecord,
  type InventoryLogTab,
} from "@/lib/inventoryLogUtils";

interface InventoryHistoryTabsProps {
  logs: InventoryLogRecord[];
  unit?: string;
  isDark: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

function LogDetailRow({
  log,
  unit,
  isDark,
  compact,
}: {
  log: InventoryLogRecord;
  unit?: string;
  isDark: boolean;
  compact?: boolean;
}) {
  const isIncrease = isLogIncrease(log.changeType, log.quantity);
  const category = getLogCategory(log.changeType);

  return (
    <div className={cn("rounded-xl border", compact ? "p-3" : "p-4", adminCard(isDark))}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-sm font-semibold",
              isIncrease
                ? isDark
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : isDark
                  ? "text-red-400"
                  : "text-red-600"
            )}
          >
            {getChangeTypeLabel(log.changeType)}
          </span>
          {category === "update" && (
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                adminMutedSurface(isDark),
                adminTextMuted(isDark)
              )}
            >
              بروزرسانی
            </span>
          )}
          <span className={cn("text-xs", adminTextMuted(isDark))}>
            {timestampToJalaliString(log.createdAt)}
          </span>
        </div>
        <span
          className={cn(
            "font-bold text-sm shrink-0",
            isIncrease ? "text-emerald-500" : "text-red-500"
          )}
        >
          {log.quantity > 0 ? "+" : ""}
          {toPersianDigits(Number(log.quantity).toFixed(2))}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>

      <div
        className={cn(
          "grid gap-2 text-xs",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        <div>
          <span className={adminTextMuted(isDark)}>قبل: </span>
          <span className={adminTextSecondary(isDark)}>
            {toPersianDigits(Number(log.previousStock).toFixed(2))}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
        <div>
          <span className={adminTextMuted(isDark)}>بعد: </span>
          <span className={adminTextSecondary(isDark)}>
            {toPersianDigits(Number(log.newStock).toFixed(2))}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
        {log.unitPrice != null && log.unitPrice > 0 && (
          <div>
            <span className={adminTextMuted(isDark)}>قیمت واحد: </span>
            <span className={adminTextSecondary(isDark)}>
              {formatToman(log.unitPrice)}
            </span>
          </div>
        )}
        {log.totalPrice != null && log.totalPrice > 0 && (
          <div>
            <span className={adminTextMuted(isDark)}>مبلغ کل: </span>
            <span className={cn("font-semibold", adminTextPrimary(isDark))}>
              {formatToman(log.totalPrice)}
            </span>
          </div>
        )}
      </div>

      {log.note && (
        <p className={cn("mt-2 text-xs leading-relaxed", adminTextMuted(isDark))}>
          {log.note}
        </p>
      )}
      {log.orderId && (
        <p className={cn("mt-1 text-[10px]", adminTextMuted(isDark))}>
          سفارش: {log.orderId.slice(0, 8)}…
        </p>
      )}
    </div>
  );
}

export function InventoryHistoryTabs({
  logs,
  unit,
  isDark,
  compact = false,
  emptyMessage = "هنوز تغییری در موجودی ثبت نشده است",
}: InventoryHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<InventoryLogTab>("all");

  const counts = useMemo(
    () => ({
      all: logs.length,
      buy: filterLogsByTab(logs, "buy").length,
      sell: filterLogsByTab(logs, "sell").length,
    }),
    [logs]
  );

  const logsByTab = useMemo(
    () => ({
      all: logs,
      buy: filterLogsByTab(logs, "buy"),
      sell: filterLogsByTab(logs, "sell"),
    }),
    [logs]
  );

  const tabTriggerClass = cn(
    "rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all",
    isDark
      ? "data-[state=inactive]:text-gray-400 data-[state=active]:bg-coffee-600 data-[state=active]:text-white"
      : "data-[state=inactive]:text-gray-600 data-[state=active]:bg-coffee-600 data-[state=active]:text-white"
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={value => setActiveTab(value as InventoryLogTab)}
      dir="rtl"
    >
      <TabsList
        className={cn(
          "grid w-full grid-cols-3 h-auto p-1 rounded-xl",
          isDark ? "bg-white/5" : "bg-gray-100"
        )}
      >
        <TabsTrigger value="all" className={tabTriggerClass}>
          همه ({toPersianDigits(String(counts.all))})
        </TabsTrigger>
        <TabsTrigger value="buy" className={tabTriggerClass}>
          خرید ({toPersianDigits(String(counts.buy))})
        </TabsTrigger>
        <TabsTrigger value="sell" className={tabTriggerClass}>
          فروش ({toPersianDigits(String(counts.sell))})
        </TabsTrigger>
      </TabsList>

      {(["all", "buy", "sell"] as InventoryLogTab[]).map(tab => (
        <TabsContent key={tab} value={tab} className="mt-4">
          {logsByTab[tab].length === 0 ? (
            <div className={cn("text-center py-10 text-sm", adminTextMuted(isDark))}>
              {emptyMessage}
            </div>
          ) : (
            <div className={cn("space-y-3", compact && "max-h-56 overflow-y-auto")}>
              {logsByTab[tab].map(log => (
                <LogDetailRow
                  key={log.id}
                  log={log}
                  unit={unit}
                  isDark={isDark}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default InventoryHistoryTabs;
