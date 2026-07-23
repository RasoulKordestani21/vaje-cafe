"use client";

import React from "react";
import { Users, UserPlus, DollarSign, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { useReportData, type DateRange } from "./useReportData";
import { ReportLoadingState, ReportErrorState } from "./ReportStates";
import { ReportSummaryCard, ReportSummaryGrid } from "./ReportSummaryCard";
import { ReportTableShell, ReportTable, reportHeadClass, reportCellClass, reportRowClass } from "./ReportTableShell";

interface CustomerReportProps {
  dateRange: DateRange;
  isDark?: boolean;
}

export default function CustomerReport({ dateRange, isDark = false }: CustomerReportProps) {
  const { loading, error, data, refetch } = useReportData<any>("/api/reports/customers", dateRange);

  if (loading) return <ReportLoadingState isDark={isDark} />;
  if (error) return <ReportErrorState message={error} onRetry={refetch} isDark={isDark} />;
  if (!data) return null;

  const { totals, segments, customers, topCustomers } = data;
  const customerList = customers ?? topCustomers ?? [];
  const head = reportHeadClass(isDark);
  const cell = reportCellClass(isDark);
  const row = reportRowClass(isDark);

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <ReportSummaryGrid>
        <ReportSummaryCard label="کل مشتریان" value={toPersianDigits((totals.totalCustomers || 0).toString())} icon={Users} iconClassName={isDark ? "text-blue-400" : "text-blue-600"} isDark={isDark} />
        <ReportSummaryCard label="مشتریان جدید" value={toPersianDigits((totals.newCustomers || 0).toString())} icon={UserPlus} iconClassName={isDark ? "text-green-400" : "text-green-600"} isDark={isDark} />
        <ReportSummaryCard label="میانگین سفارش" value={formatToman(totals.avgOrderValue || 0)} icon={DollarSign} iconClassName={isDark ? "text-purple-400" : "text-purple-600"} isDark={isDark} />
        <ReportSummaryCard label="مشتریان با امتیاز" value={toPersianDigits((totals.customersWithPoints || 0).toString())} icon={Star} iconClassName={isDark ? "text-yellow-400" : "text-yellow-600"} isDark={isDark} />
      </ReportSummaryGrid>

      {segments && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")} dir="rtl">
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-base sm:text-lg", isDark ? "text-white" : "text-gray-900")}>
              تقسیم‌بندی مشتریان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={cn("p-4 rounded-lg border", isDark ? "bg-purple-900/30 border-purple-500/30" : "bg-purple-50 border-purple-200")}>
                <p className={cn("text-sm mb-1", isDark ? "text-purple-300" : "text-purple-700")}>VIP</p>
                <p className={cn("text-2xl sm:text-3xl font-bold", isDark ? "text-purple-400" : "text-purple-600")}>
                  {toPersianDigits((segments.vip || 0).toString())}
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>۱M+ تومان</p>
              </div>
              <div className={cn("p-4 rounded-lg border", isDark ? "bg-blue-900/30 border-blue-500/30" : "bg-blue-50 border-blue-200")}>
                <p className={cn("text-sm mb-1", isDark ? "text-blue-300" : "text-blue-700")}>عادی</p>
                <p className={cn("text-2xl sm:text-3xl font-bold", isDark ? "text-blue-400" : "text-blue-600")}>
                  {toPersianDigits((segments.regular || 0).toString())}
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>۲۰۰K – ۱M</p>
              </div>
              <div className={cn("p-4 rounded-lg border", isDark ? "bg-green-900/30 border-green-500/30" : "bg-green-50 border-green-200")}>
                <p className={cn("text-sm mb-1", isDark ? "text-green-300" : "text-green-700")}>جدید</p>
                <p className={cn("text-2xl sm:text-3xl font-bold", isDark ? "text-green-400" : "text-green-600")}>
                  {toPersianDigits((segments.new || 0).toString())}
                </p>
                <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>زیر ۲۰۰K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {totals && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")} dir="rtl">
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-base sm:text-lg", isDark ? "text-white" : "text-gray-900")}>
              خلاصه برنامه وفاداری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-400" : "text-gray-600")}>امتیازهای اعطا شده</p>
                <p className={cn("text-xl sm:text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>{toPersianDigits((totals.totalPointsAwarded || 0).toString())}</p>
              </div>
              <div>
                <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-400" : "text-gray-600")}>امتیازهای استفاده شده</p>
                <p className={cn("text-xl sm:text-2xl font-bold mt-1", isDark ? "text-red-400" : "text-red-600")}>{toPersianDigits((totals.totalPointsRedeemed || 0).toString())}</p>
              </div>
              <div>
                <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-400" : "text-gray-600")}>موجودی کل امتیازها</p>
                <p className={cn("text-xl sm:text-2xl font-bold mt-1", isDark ? "text-green-400" : "text-green-600")}>
                  {toPersianDigits(((totals.totalPointsAwarded || 0) - (totals.totalPointsRedeemed || 0)).toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {customerList.length > 0 && (
        <ReportTableShell
          title="لیست مشتریان"
          subtitle={`${toPersianDigits(customerList.length.toString())} مشتری`}
          isDark={isDark}
        >
          <ReportTable>
            <Table>
              <TableHeader>
                <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                  <TableHead className={head}>نام</TableHead>
                  <TableHead className={head}>تماس</TableHead>
                  <TableHead className={head}>سفارشات دوره</TableHead>
                  <TableHead className={head}>خرید دوره</TableHead>
                  <TableHead className={head}>کل سفارشات</TableHead>
                  <TableHead className={head}>کل خرید</TableHead>
                  <TableHead className={head}>آخرین سفارش</TableHead>
                  <TableHead className={head}>امتیاز</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerList.map((customer: any) => (
                  <TableRow key={customer.id} className={row}>
                    <TableCell className={cn("font-medium whitespace-nowrap", isDark ? "text-white" : "text-gray-900")}>
                      {customer.name || "بدون نام"}
                    </TableCell>
                    <TableCell className={cn(cell, "whitespace-nowrap")}>{customer.phone || "-"}</TableCell>
                    <TableCell className={cell}>{toPersianDigits((customer.ordersInPeriod || 0).toString())}</TableCell>
                    <TableCell className={cn("font-semibold whitespace-nowrap", isDark ? "text-green-400" : "text-green-600")}>
                      {formatToman(customer.spentInPeriod || 0)}
                    </TableCell>
                    <TableCell className={cell}>{toPersianDigits((customer.totalOrders || 0).toString())}</TableCell>
                    <TableCell className={cn("font-semibold whitespace-nowrap", isDark ? "text-green-400" : "text-green-600")}>
                      {formatToman(customer.totalSpent || 0)}
                    </TableCell>
                    <TableCell className={cn(cell, "whitespace-nowrap text-xs")}>
                      {customer.lastOrderDate ? timestampToJalaliString(customer.lastOrderDate as number) : "-"}
                    </TableCell>
                    <TableCell className={cell}>
                      <span className="inline-flex items-center gap-1 flex-row-reverse">
                        <Star size={13} className={cn("fill-current", isDark ? "text-yellow-400" : "text-yellow-500")} />
                        {toPersianDigits((customer.loyalty_points_balance || 0).toString())}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportTable>
        </ReportTableShell>
      )}
    </div>
  );
}
