"use client";

import React, { useState, useEffect } from "react";
import { Download, FileText, BarChart3, Users, Package, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { formatToman, toPersianDigits } from "@/utils/format";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";
import SalesReport from "./SalesReport";
import InventoryReport from "./InventoryReport";
import StaffReport from "./StaffReport";
import CustomerReport from "./CustomerReport";

interface ReportsManagerProps {
  isDark?: boolean;
}

export default function ReportsManager({ isDark = false }: ReportsManagerProps) {
  const [activeTab, setActiveTab] = useState<"sales" | "inventory" | "staff" | "customers">("sales");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (reportType: string) => {
    try {
      setIsExporting(true);
      const startDate = dateRange.from ? jalaliToTimestamp(dateRange.from) : undefined;
      const endDate = dateRange.to ? jalaliToTimestamp(dateRange.to) : undefined;

      const params = new URLSearchParams();
      params.append("type", reportType);
      if (startDate) params.append("startDate", startDate.toString());
      if (endDate) params.append("endDate", endDate.toString());

      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("خطا در خروجی‌گیری گزارش");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("خطا در خروجی‌گیری گزارش");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            گزارش‌های پیشرفته
          </h2>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
            گزارش‌های جامع فروش، موجودی، پرسنل و مشتریان
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <ScrollingJalaliDatePicker
                value={dateRange.from}
                onChange={(value) => setDateRange((prev) => ({ ...prev, from: value }))}
                label="از تاریخ"
                isDark={isDark}
              />
            </div>
            <div className="flex-1">
              <ScrollingJalaliDatePicker
                value={dateRange.to}
                onChange={(value) => setDateRange((prev) => ({ ...prev, to: value }))}
                label="تا تاریخ"
                isDark={isDark}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setDateRange({ from: "", to: "" })}
              className={cn(
                isDark
                  ? "border-neutral-700 text-white hover:bg-neutral-800"
                  : "border-gray-300"
              )}
            >
              بازنشانی
            </Button>
            <Button
              onClick={() => handleExport(activeTab)}
              disabled={isExporting}
              className="bg-coffee-600 hover:bg-coffee-700 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  در حال خروجی‌گیری...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={16} />
                  خروجی CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className={cn(
          "mb-6",
          isDark ? "bg-neutral-900 border-white/5" : "bg-gray-100 border-gray-300"
        )}>
          <TabsTrigger
            value="sales"
            className={cn(
              isDark
                ? "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-400"
                : "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-600"
            )}
          >
            <BarChart3 className="mr-2" size={16} />
            گزارش فروش
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className={cn(
              isDark
                ? "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-400"
                : "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-600"
            )}
          >
            <Package className="mr-2" size={16} />
            گزارش موجودی
          </TabsTrigger>
          <TabsTrigger
            value="staff"
            className={cn(
              isDark
                ? "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-400"
                : "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-600"
            )}
          >
            <Users className="mr-2" size={16} />
            گزارش پرسنل
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className={cn(
              isDark
                ? "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-400"
                : "data-[state=active]:bg-coffee-600 data-[state=active]:text-white text-gray-600"
            )}
          >
            <TrendingUp className="mr-2" size={16} />
            گزارش مشتریان
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-0">
          <SalesReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <InventoryReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>

        <TabsContent value="staff" className="mt-0">
          <StaffReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>

        <TabsContent value="customers" className="mt-0">
          <CustomerReport dateRange={dateRange} isDark={isDark} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


