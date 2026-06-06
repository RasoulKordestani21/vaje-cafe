"use client";

import React, { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";

interface InventoryReportProps {
  dateRange: { from: string; to: string };
  isDark?: boolean;
}

export default function InventoryReport({ dateRange, isDark = false }: InventoryReportProps) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.from ? jalaliToTimestamp(dateRange.from) : undefined;
      const endDate = dateRange.to ? jalaliToTimestamp(dateRange.to) : undefined;

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toString());
      if (endDate) params.append("endDate", endDate.toString());

      const response = await fetch(`/api/reports/inventory?${params.toString()}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching inventory report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className={cn("text-center py-20", isDark ? "text-gray-400" : "text-gray-600")}>
        خطا در دریافت گزارش
      </div>
    );
  }

  const { rawMaterials, lowStock, totals, categoryBreakdown } = reportData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  کل آیتم‌ها
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.totalItems || 0).toString())}
                </p>
              </div>
              <Package size={32} className={cn(isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  ارزش کل موجودی
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {formatToman(totals.totalValue || 0)}
                </p>
              </div>
              <DollarSign size={32} className={cn(isDark ? "text-green-400" : "text-green-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  آیتم‌های کم‌مصرف
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-red-400" : "text-red-600")}>
                  {toPersianDigits((totals.lowStockCount || 0).toString())}
                </p>
              </div>
              <AlertTriangle size={32} className={cn(isDark ? "text-red-400" : "text-red-600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <Card className={cn("border-red-300", isDark ? "bg-neutral-900 border-red-500" : "bg-red-50")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isDark ? "text-red-400" : "text-red-700")}>
              <AlertTriangle size={20} />
              هشدار: آیتم‌های کم‌مصرف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-red-500/20" : "border-red-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نام</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>دسته‌بندی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>موجودی فعلی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>حداقل موجودی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>واحد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((item: any) => (
                    <TableRow
                      key={item.id}
                      className={isDark ? "border-red-500/10 hover:bg-neutral-800" : "border-red-200 hover:bg-red-100"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {item.name}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {item.category}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-red-400" : "text-red-600")}>
                        {toPersianDigits((item.current_stock || 0).toString())}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((item.min_stock || 0).toString())}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Items */}
      {rawMaterials && rawMaterials.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              موجودی مواد اولیه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نام</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>دسته‌بندی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>موجودی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>واحد</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>قیمت</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>ارزش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>مصرف</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تأمین</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.map((item: any) => {
                    const value = (item.current_stock || 0) * (item.price || 0);
                    const isLowStock = item.current_stock <= item.min_stock;
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50",
                          isLowStock && (isDark ? "bg-red-900/20" : "bg-red-50")
                        )}
                      >
                        <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                          {item.name}
                        </TableCell>
                        <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                          {item.category}
                        </TableCell>
                        <TableCell className={cn(
                          "font-semibold",
                          isLowStock
                            ? (isDark ? "text-red-400" : "text-red-600")
                            : (isDark ? "text-white" : "text-gray-900")
                        )}>
                          {toPersianDigits((item.current_stock || 0).toString())}
                        </TableCell>
                        <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                          {item.unit}
                        </TableCell>
                        <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                          {formatToman(item.price || 0)}
                        </TableCell>
                        <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                          {formatToman(value)}
                        </TableCell>
                        <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                          {toPersianDigits((item.usageQuantity || 0).toString())}
                        </TableCell>
                        <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                          {toPersianDigits((item.restockQuantity || 0).toString())}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              موجودی بر اساس دسته‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>دسته‌بندی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد آیتم</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>ارزش کل</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>آیتم‌های کم‌مصرف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.map((cat: any, index: number) => (
                    <TableRow
                      key={cat.category || index}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {cat.category}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((cat.itemCount || 0).toString())}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                        {formatToman(cat.totalValue || 0)}
                      </TableCell>
                      <TableCell className={cn(
                        cat.lowStockCount > 0 ? (isDark ? "text-red-400" : "text-red-600") : (isDark ? "text-gray-300" : "text-gray-700")
                      )}>
                        {toPersianDigits((cat.lowStockCount || 0).toString())}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


