"use client";

import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/PriceInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adminCard,
  adminInput,
  adminSelectContent,
  adminSelectItem,
  adminSelectTrigger,
  adminTextPrimary
} from "@/lib/adminTheme";

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

  const inputClass = cn("w-full", adminInput(isDark));
  const selectTriggerClass = cn("w-full", adminSelectTrigger(isDark));
  const selectContentClass = adminSelectContent(isDark);

  const cardClass = cn("p-4 rounded-2xl border", adminCard(isDark));

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={17}
            className={isDark ? "text-coffee-400" : "text-coffee-600"}
          />
          <h3 className={cn("font-bold text-sm", adminTextPrimary(isDark))}>
            فیلتر و جستجو
          </h3>
        </div>
        <Button
          type="button"
          onClick={onReset}
          variant="ghost"
          size="sm"
          className={cn(
            "text-xs h-8",
            isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
          )}
        >
          بازنشانی
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <div className="lg:col-span-1">
          <label
            className={cn(
              "block text-xs mb-1.5",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            جستجو
          </label>
          <div className="relative">
            <Search
              size={14}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                isDark ? "text-gray-500" : "text-gray-400"
              )}
            />
            <Input
              type="text"
              value={value.search}
              onChange={e => handleChange({ search: e.target.value })}
              placeholder="نام، تلفن، شماره سفارش..."
              className={cn(inputClass, "pr-9")}
            />
          </div>
        </div>
        <PriceInput
          label="حداقل مبلغ"
          value={value.minAmount || ''}
          onChange={(value, numericValue) => handleChange({ minAmount: value })}
          placeholder="۰"
          min={0}
          labelClassName={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}
          inputClassName={inputClass}
          showValidation={false}
        />
        <PriceInput
          label="حداکثر مبلغ"
          value={value.maxAmount || ''}
          onChange={(value, numericValue) => handleChange({ maxAmount: value })}
          placeholder="بدون محدودیت"
          min={0}
          labelClassName={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}
          inputClassName={inputClass}
          showValidation={false}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          dir="rtl"
          value={value.source || "all"}
          onValueChange={val =>
            handleChange({ source: val as OrderFilterState["source"] })
          }
        >
          <SelectTrigger dir="rtl" className={selectTriggerClass}>
            <SelectValue placeholder="منبع" />
          </SelectTrigger>
          <SelectContent dir="rtl" className={selectContentClass}>
            <SelectItem value="all" className={adminSelectItem}>همه منابع</SelectItem>
            <SelectItem value="website" className={adminSelectItem}>وب‌سایت</SelectItem>
            <SelectItem value="manual" className={adminSelectItem}>دستی</SelectItem>
          </SelectContent>
        </Select>

        <Select
          dir="rtl"
          value={value.status || "all"}
          onValueChange={val =>
            handleChange({ status: val as OrderFilterState["status"] })
          }
        >
          <SelectTrigger dir="rtl" className={selectTriggerClass}>
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent dir="rtl" className={selectContentClass}>
            <SelectItem value="all" className={adminSelectItem}>همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending" className={adminSelectItem}>در انتظار</SelectItem>
            <SelectItem value="completed" className={adminSelectItem}>تکمیل شده</SelectItem>
            <SelectItem value="cancelled" className={adminSelectItem}>لغو شده</SelectItem>
          </SelectContent>
        </Select>

        <ScrollingJalaliDatePicker
          value={value.dateFrom}
          onChange={v => handleChange({ dateFrom: v })}
          placeholder="از تاریخ"
          isDark={isDark}
        />

        <ScrollingJalaliDatePicker
          value={value.dateTo}
          onChange={v => handleChange({ dateTo: v })}
          placeholder="تا تاریخ"
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default OrderFilters;
