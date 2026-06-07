"use client";

import React from "react";
import { Search } from "lucide-react";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface OrderFilterState {
  source: "all" | "website" | "manual";
  status: "all" | "pending" | "completed" | "cancelled";
  dateFrom: string;
  dateTo: string;
  search: string;
  minAmount: string;
  maxAmount: string;
}

interface OrderFiltersProps {
  value: OrderFilterState;
  onChange: (next: OrderFilterState) => void;
  onReset: () => void;
  isDark: boolean;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  value,
  onChange,
  onReset,
  isDark
}) => {
  const handleChange = (patch: Partial<OrderFilterState>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4">
      {/* Advanced Search & Filters */}
      <div
        className={cn(
          "p-4 rounded-2xl border",
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Search
            size={18}
            className={isDark ? "text-gray-400" : "text-gray-600"}
          />
          <h3
            className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}
          >
            جستجوی پیشرفته
          </h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-1 gap-4">
          <div>
            <label
              className={cn(
                "block text-sm mb-1",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              جستجو (نام، تلفن، شماره سفارش)
            </label>
            <Input
              type="text"
              value={value.search}
              onChange={e => handleChange({ search: e.target.value })}
              placeholder="جستجو..."
              className={cn(
                "w-full",
                isDark
                  ? "bg-neutral-800 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              )}
            />
          </div>
          <div>
            <label
              className={cn(
                "block text-sm mb-1",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              حداقل مبلغ (تومان)
            </label>
            <Input
              type="number"
              value={value.minAmount}
              onChange={e => handleChange({ minAmount: e.target.value })}
              placeholder="0"
              className={cn(
                "w-full",
                isDark
                  ? "bg-neutral-800 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              )}
            />
          </div>
          <div>
            <label
              className={cn(
                "block text-sm mb-1",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              حداکثر مبلغ (تومان)
            </label>
            <Input
              type="number"
              value={value.maxAmount}
              onChange={e => handleChange({ maxAmount: e.target.value })}
              placeholder="بدون محدودیت"
              className={cn(
                "w-full",
                isDark
                  ? "bg-neutral-800 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              )}
            />
          </div>
        </div>
      </div>

      {/* Basic Filters (source, status, dates, reset) */}
      <div
        className={cn(
          "p-4 rounded-2xl border flex flex-row sm:flex-col gap-4 flex-wrap items-end",
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        )}
      >
        <Select
          value={value.source || "all"}
          onValueChange={val =>
            handleChange({ source: val as OrderFilterState["source"] })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[180px]",
              isDark
                ? "bg-neutral-800 border-white/10 text-white"
                : "bg-white border-gray-300 text-gray-900"
            )}
          >
            <SelectValue placeholder="همه منابع" />
          </SelectTrigger>
          <SelectContent
            className={cn(
              isDark ? "bg-neutral-900 text-white" : "bg-white text-gray-900"
            )}
          >
            <SelectItem value="all">همه منابع</SelectItem>
            <SelectItem value="website">وب‌سایت</SelectItem>
            <SelectItem value="manual">دستی</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.status || "all"}
          onValueChange={val =>
            handleChange({ status: val as OrderFilterState["status"] })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[180px]",
              isDark
                ? "bg-neutral-800 border-white/10 text-white"
                : "bg-white border-gray-300 text-gray-900"
            )}
          >
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent
            className={cn(
              isDark ? "bg-neutral-900 text-white" : "bg-white text-gray-900"
            )}
          >
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending">درحال انتظار</SelectItem>
            <SelectItem value="completed">تکمیل شده</SelectItem>
            <SelectItem value="cancelled">لغو شده</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-[200px]">
          <ScrollingJalaliDatePicker
            value={value.dateFrom}
            onChange={v => handleChange({ dateFrom: v })}
            placeholder="از تاریخ"
            isDark={isDark}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <ScrollingJalaliDatePicker
            value={value.dateTo}
            onChange={v => handleChange({ dateTo: v })}
            placeholder="تا تاریخ"
            isDark={isDark}
          />
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className={cn(
            isDark
              ? "bg-neutral-800 border-white/10 text-white hover:bg-neutral-700"
              : "bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300"
          )}
        >
          بازنشانی فیلترها
        </Button>
      </div>
    </div>
  );
};

export default OrderFilters;
