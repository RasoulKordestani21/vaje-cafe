"use client";

import React, { useState } from "react";
import {
  Download,
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import { REPORT_DATE_PRESETS, presetRangeDays } from "@/lib/reports/dateRange";
import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/reports/csvExport";
import { downloadReportCsv, type DateRange } from "./useReportData";
import { useToast } from "@/components/ui/toast";
import SalesReport from "./SalesReport";
import InventoryReport from "./InventoryReport";
import StaffReport from "./StaffReport";
import CustomerReport from "./CustomerReport";

interface ReportsManagerProps {
  isDark?: boolean;
}

const TABS: { value: ReportType; label: string; icon: React.ElementType }[] = [
  { value: "sales", label: "فروش", icon: BarChart3 },
  { value: "inventory", label: "موجودی", icon: Package },
  { value: "staff", label: "پرسنل", icon: Users },
  { value: "customers", label: "مشتریان", icon: TrendingUp },
];

export default function ReportsManager({ isDark = false }: ReportsManagerProps) {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<ReportType>("sales");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const applyPreset = (presetId: string, days: number) => {
    const range = presetRangeDays(days);
    setDateRange(range);
    setActivePreset(presetId);
  };

  const handleDateChange = (field: "from" | "to", value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    setActivePreset(null);
  };

  const handleReset = () => {
    setDateRange({ from: "", to: "" });
    setActivePreset(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await downloadReportCsv(activeTab, dateRange);
    setIsExporting(false);
    if (result.ok) {
      success(`فایل CSV گزارش ${REPORT_TYPE_LABELS[activeTab]} با موفقیت دانلود شد.`);
    } else {
      showError(result.error);
    }
  };

  const rangeLabel = () => {
    if (!dateRange.from && !dateRange.to) return "۳۰ روز گذشته (پیش‌فرض)";
    const from = dateRange.from ? toPersianDigits(formatJalaliDate(dateRange.from)) : "—";
    const to = dateRange.to ? toPersianDigits(formatJalaliDate(dateRange.to)) : "امروز";
    return `${from} تا ${to}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h2 className={cn("text-xl sm:text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          گزارش‌های پیشرفته
        </h2>
        <p className={cn("text-xs sm:text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
          گزارش‌های فروش، موجودی، پرسنل و مشتریان — با خروجی CSV
        </p>
      </div>

      {/* Filters */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
        <CardContent className="p-4 space-y-4">
          {/* Quick presets */}
          <div>
            <p className={cn("text-xs font-medium mb-2", isDark ? "text-gray-400" : "text-gray-600")}>
              بازه سریع
            </p>
            <div className="flex flex-wrap gap-2">
              {REPORT_DATE_PRESETS.map(p => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={activePreset === p.id ? "default" : "outline"}
                  onClick={() => applyPreset(p.id, p.days)}
                  className={cn(
                    "text-xs sm:text-sm",
                    activePreset !== p.id && (isDark ? "border-neutral-700" : "border-gray-300"),
                    activePreset === p.id && "bg-coffee-600 hover:bg-coffee-700 text-white"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date pickers + actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
            <ScrollingJalaliDatePicker
              value={dateRange.from}
              onChange={v => handleDateChange("from", v)}
              label="از تاریخ"
              isDark={isDark}
            />
            <ScrollingJalaliDatePicker
              value={dateRange.to}
              onChange={v => handleDateChange("to", v)}
              label="تا تاریخ"
              isDark={isDark}
            />
            <Button
              variant="outline"
              onClick={handleReset}
              className={cn(
                "w-full sm:w-auto",
                isDark ? "border-neutral-700 text-white hover:bg-neutral-800" : "border-gray-300"
              )}
            >
              بازنشانی
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full sm:w-auto bg-coffee-600 hover:bg-coffee-700 text-white shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="animate-spin ml-2" size={16} />
                  در حال خروجی...
                </>
              ) : (
                <>
                  <Download className="ml-2" size={16} />
                  خروجی CSV
                </>
              )}
            </Button>
          </div>

          {/* Active range + export feedback */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-dashed border-gray-200 dark:border-neutral-800">
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>
              بازه فعال: <span className={cn("font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{rangeLabel()}</span>
              {" · "}
              گزارش: <span className={cn("font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{REPORT_TYPE_LABELS[activeTab]}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as ReportType); }}>
        <div className="overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide" dir="rtl">
          <TabsList className={cn(
            "inline-flex w-max min-w-full sm:min-w-0 sm:w-auto h-auto p-1 gap-1 flex-row-reverse",
            isDark ? "bg-neutral-900 border border-white/5" : "bg-gray-100 border border-gray-200"
          )}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap flex-row-reverse",
                    "data-[state=active]:bg-coffee-600 data-[state=active]:text-white",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  <Icon size={15} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="sales" className="mt-4 sm:mt-6">
          <SalesReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4 sm:mt-6">
          <InventoryReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>
        <TabsContent value="staff" className="mt-4 sm:mt-6">
          <StaffReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>
        <TabsContent value="customers" className="mt-4 sm:mt-6">
          <CustomerReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
