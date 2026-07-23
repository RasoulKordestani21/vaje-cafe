"use client";

import React from "react";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { useReportData, type DateRange } from "./useReportData";
import { ReportLoadingState, ReportErrorState } from "./ReportStates";
import { ReportSummaryCard, ReportSummaryGrid } from "./ReportSummaryCard";
import { ReportTableShell, ReportTable, reportHeadClass, reportCellClass, reportRowClass } from "./ReportTableShell";

interface SalesReportProps {
  dateRange: DateRange;
  isDark?: boolean;
}

export default function SalesReport({ dateRange, isDark = false }: SalesReportProps) {
  const { loading, error, data, refetch } = useReportData<any>(
    "/api/reports/sales",
    dateRange,
    { status: "completed" }
  );

  if (loading) return <ReportLoadingState isDark={isDark} />;
  if (error) return <ReportErrorState message={error} onRetry={refetch} isDark={isDark} />;
  if (!data) return null;

  const { totals, categoryData, itemSales, topItems, orders } = data;
  const items = itemSales ?? topItems ?? [];
  const head = reportHeadClass(isDark);
  const cell = reportCellClass(isDark);
  const row = reportRowClass(isDark);

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <ReportSummaryGrid>
        <ReportSummaryCard label="کل فروش" value={formatToman(totals.totalSales || 0)} icon={DollarSign} iconClassName={isDark ? "text-green-400" : "text-green-600"} isDark={isDark} />
        <ReportSummaryCard label="تعداد سفارشات" value={toPersianDigits((totals.totalOrders || 0).toString())} icon={ShoppingCart} iconClassName={isDark ? "text-blue-400" : "text-blue-600"} isDark={isDark} />
        <ReportSummaryCard label="میانگین سفارش" value={formatToman(totals.avgOrderValue || 0)} icon={TrendingUp} iconClassName={isDark ? "text-purple-400" : "text-purple-600"} isDark={isDark} />
        <ReportSummaryCard label="مشتریان منحصر به فرد" value={toPersianDigits((totals.uniqueCustomers || 0).toString())} icon={Users} iconClassName={isDark ? "text-orange-400" : "text-orange-600"} isDark={isDark} />
      </ReportSummaryGrid>

      {items.length > 0 && (
        <ReportTableShell
          title="فروش آیتم‌ها"
          subtitle={`${toPersianDigits(items.length.toString())} آیتم`}
          isDark={isDark}
        >
          <ReportTable>
            <Table>
              <TableHeader>
                <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                  <TableHead className={head}>نام آیتم</TableHead>
                  <TableHead className={head}>تعداد فروش</TableHead>
                  <TableHead className={head}>درآمد</TableHead>
                  <TableHead className={head}>تعداد سفارشات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any, index: number) => (
                  <TableRow key={item.menuItemId || index} className={row}>
                    <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{item.name}</TableCell>
                    <TableCell className={cell}>{toPersianDigits((item.totalQuantity || 0).toString())}</TableCell>
                    <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>{formatToman(item.totalRevenue || 0)}</TableCell>
                    <TableCell className={cell}>{toPersianDigits((item.orderCount || 0).toString())}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportTable>
        </ReportTableShell>
      )}

      {categoryData?.length > 0 && (
        <ReportTableShell
          title="فروش بر اساس دسته‌بندی"
          subtitle={`${toPersianDigits(categoryData.length.toString())} دسته`}
          isDark={isDark}
        >
          <ReportTable>
            <Table>
              <TableHeader>
                <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                  <TableHead className={head}>دسته‌بندی</TableHead>
                  <TableHead className={head}>تعداد سفارشات</TableHead>
                  <TableHead className={head}>مقدار فروش</TableHead>
                  <TableHead className={head}>درآمد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((cat: any, index: number) => (
                  <TableRow key={cat.category || index} className={row}>
                    <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{cat.category}</TableCell>
                    <TableCell className={cell}>{toPersianDigits((cat.orderCount || 0).toString())}</TableCell>
                    <TableCell className={cell}>{toPersianDigits((cat.totalQuantity || 0).toString())}</TableCell>
                    <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>{formatToman(cat.totalRevenue || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportTable>
        </ReportTableShell>
      )}

      {orders?.length > 0 && (
        <ReportTableShell
          title="لیست سفارشات"
          subtitle={`${toPersianDigits(orders.length.toString())} سفارش`}
          isDark={isDark}
        >
          <ReportTable>
            <Table>
              <TableHeader>
                <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                  <TableHead className={head}>شناسه</TableHead>
                  <TableHead className={head}>تاریخ</TableHead>
                  <TableHead className={head}>وضعیت</TableHead>
                  <TableHead className={head}>منبع</TableHead>
                  <TableHead className={head}>مبلغ</TableHead>
                  <TableHead className={head}>آیتم</TableHead>
                  <TableHead className={head}>مشتری</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id} className={row}>
                    <TableCell className={cn("font-mono text-xs", cell)}>{order.id?.slice(0, 8)}…</TableCell>
                    <TableCell className={cn(cell, "text-xs whitespace-nowrap")}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("fa-IR") : "—"}</TableCell>
                    <TableCell className={cell}>{order.status}</TableCell>
                    <TableCell className={cell}>{order.source || "—"}</TableCell>
                    <TableCell className={cn("font-semibold whitespace-nowrap", isDark ? "text-green-400" : "text-green-600")}>{formatToman(order.totalPrice || 0)}</TableCell>
                    <TableCell className={cell}>{toPersianDigits((order.itemCount || 0).toString())}</TableCell>
                    <TableCell className={cn(cell, "whitespace-nowrap")}>{order.customerName || order.customerPhone || "—"}</TableCell>
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
