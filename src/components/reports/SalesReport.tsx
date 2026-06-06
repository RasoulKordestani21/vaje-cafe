"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";

interface SalesReportProps {
  dateRange: { from: string; to: string };
  isDark?: boolean;
}

export default function SalesReport({ dateRange, isDark = false }: SalesReportProps) {
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
      params.append("status", "completed");

      const response = await fetch(`/api/reports/sales?${params.toString()}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching sales report:", error);
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

  const { totals, orders, dailyData, categoryData, topItems } = reportData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  کل فروش
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {formatToman(totals.totalSales || 0)}
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
                  تعداد سفارشات
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.totalOrders || 0).toString())}
                </p>
              </div>
              <ShoppingCart size={32} className={cn(isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  میانگین سفارش
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {formatToman(totals.avgOrderValue || 0)}
                </p>
              </div>
              <TrendingUp size={32} className={cn(isDark ? "text-purple-400" : "text-purple-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  مشتریان منحصر به فرد
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.uniqueCustomers || 0).toString())}
                </p>
              </div>
              <Users size={32} className={cn(isDark ? "text-orange-400" : "text-orange-600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      {topItems && topItems.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              پرفروش‌ترین آیتم‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نام آیتم</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد فروش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>درآمد</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد سفارشات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topItems.slice(0, 10).map((item: any, index: number) => (
                    <TableRow
                      key={item.menuItemId || index}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {item.name}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((item.totalQuantity || 0).toString())}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                        {formatToman(item.totalRevenue || 0)}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((item.orderCount || 0).toString())}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {categoryData && categoryData.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              فروش بر اساس دسته‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>دسته‌بندی</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد سفارشات</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>مقدار فروش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>درآمد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.map((cat: any, index: number) => (
                    <TableRow
                      key={cat.category || index}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {cat.category}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((cat.orderCount || 0).toString())}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((cat.totalQuantity || 0).toString())}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                        {formatToman(cat.totalRevenue || 0)}
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


