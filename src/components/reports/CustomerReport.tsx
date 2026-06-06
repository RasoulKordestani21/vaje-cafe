"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, TrendingUp, Star, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";

interface CustomerReportProps {
  dateRange: { from: string; to: string };
  isDark?: boolean;
}

export default function CustomerReport({ dateRange, isDark = false }: CustomerReportProps) {
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

      const response = await fetch(`/api/reports/customers?${params.toString()}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching customer report:", error);
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

  const { totals, segments, topCustomers } = reportData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  کل مشتریان
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.totalCustomers || 0).toString())}
                </p>
              </div>
              <Users size={32} className={cn(isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  مشتریان جدید
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.newCustomers || 0).toString())}
                </p>
              </div>
              <UserPlus size={32} className={cn(isDark ? "text-green-400" : "text-green-600")} />
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
              <DollarSign size={32} className={cn(isDark ? "text-purple-400" : "text-purple-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  مشتریان با امتیاز
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.customersWithPoints || 0).toString())}
                </p>
              </div>
              <Star size={32} className={cn(isDark ? "text-yellow-400" : "text-yellow-600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      {segments && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              تقسیم‌بندی مشتریان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={cn("p-4 rounded-lg", isDark ? "bg-purple-900/30 border border-purple-500/30" : "bg-purple-50 border border-purple-200")}>
                <p className={cn("text-sm mb-2", isDark ? "text-purple-300" : "text-purple-700")}>
                  مشتریان VIP
                </p>
                <p className={cn("text-3xl font-bold", isDark ? "text-purple-400" : "text-purple-600")}>
                  {toPersianDigits((segments.vip || 0).toString())}
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                  1 میلیون تومان و بالاتر
                </p>
              </div>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-blue-900/30 border border-blue-500/30" : "bg-blue-50 border border-blue-200")}>
                <p className={cn("text-sm mb-2", isDark ? "text-blue-300" : "text-blue-700")}>
                  مشتریان عادی
                </p>
                <p className={cn("text-3xl font-bold", isDark ? "text-blue-400" : "text-blue-600")}>
                  {toPersianDigits((segments.regular || 0).toString())}
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                  200 هزار تا 1 میلیون تومان
                </p>
              </div>
              <div className={cn("p-4 rounded-lg", isDark ? "bg-green-900/30 border border-green-500/30" : "bg-green-50 border border-green-200")}>
                <p className={cn("text-sm mb-2", isDark ? "text-green-300" : "text-green-700")}>
                  مشتریان جدید
                </p>
                <p className={cn("text-3xl font-bold", isDark ? "text-green-400" : "text-green-600")}>
                  {toPersianDigits((segments.new || 0).toString())}
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                  کمتر از 200 هزار تومان
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loyalty Points Summary */}
      {totals && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              خلاصه برنامه وفاداری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  امتیازهای اعطا شده
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.totalPointsAwarded || 0).toString())}
                </p>
              </div>
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  امتیازهای استفاده شده
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-red-400" : "text-red-600")}>
                  {toPersianDigits((totals.totalPointsRedeemed || 0).toString())}
                </p>
              </div>
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  موجودی کل امتیازها
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-green-400" : "text-green-600")}>
                  {toPersianDigits(((totals.totalPointsAwarded || 0) - (totals.totalPointsRedeemed || 0)).toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Customers */}
      {topCustomers && topCustomers.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              برترین مشتریان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نام</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>شماره تماس</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد سفارشات</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>کل خرید</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>آخرین سفارش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>امتیاز</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.slice(0, 20).map((customer: any) => (
                    <TableRow
                      key={customer.id}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {customer.name || "بدون نام"}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {customer.phone || "-"}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((customer.totalOrders || 0).toString())}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                        {formatToman(customer.totalSpent || 0)}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {customer.lastOrderDate ? timestampToJalaliString(customer.lastOrderDate) : "-"}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        <div className="flex items-center gap-1">
                          <Star size={14} className={cn("fill-current", isDark ? "text-yellow-400" : "text-yellow-500")} />
                          {toPersianDigits((customer.loyalty_points_balance || 0).toString())}
                        </div>
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


