"use client";

import React from "react";
import { Package, AlertTriangle, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { useReportData, type DateRange } from "./useReportData";
import { ReportLoadingState, ReportErrorState } from "./ReportStates";
import { ReportSummaryCard, ReportSummaryGrid } from "./ReportSummaryCard";
import { ReportTableShell, ReportTable, reportHeadClass, reportCellClass, reportRowClass } from "./ReportTableShell";

interface InventoryReportProps {
  dateRange: DateRange;
  isDark?: boolean;
}

export default function InventoryReport({ dateRange, isDark = false }: InventoryReportProps) {
  const { loading, error, data, refetch } = useReportData<any>("/api/reports/inventory", dateRange);

  if (loading) return <ReportLoadingState isDark={isDark} />;
  if (error) return <ReportErrorState message={error} onRetry={refetch} isDark={isDark} />;
  if (!data) return null;

  const { rawMaterials, lowStock, totals, categoryBreakdown } = data;
  const head = reportHeadClass(isDark);
  const cell = reportCellClass(isDark);
  const row = reportRowClass(isDark);

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <ReportSummaryGrid>
        <ReportSummaryCard label="کل آیتم‌ها" value={toPersianDigits((totals.totalItems || 0).toString())} icon={Package} iconClassName={isDark ? "text-blue-400" : "text-blue-600"} isDark={isDark} />
        <ReportSummaryCard label="ارزش کل موجودی" value={formatToman(totals.totalValue || 0)} icon={DollarSign} iconClassName={isDark ? "text-green-400" : "text-green-600"} isDark={isDark} />
        <ReportSummaryCard label="آیتم‌های کم‌موجودی" value={toPersianDigits((totals.lowStockCount || 0).toString())} icon={AlertTriangle} iconClassName={isDark ? "text-red-400" : "text-red-600"} isDark={isDark} />
      </ReportSummaryGrid>

      {lowStock?.length > 0 && (
        <ReportTableShell
          title="هشدار: آیتم‌های کم‌موجودی"
          isDark={isDark}
          className={isDark ? "border-red-500/40" : "border-red-200 bg-red-50/30"}
          headerClassName={isDark ? "text-red-400" : "text-red-700"}
        >
          <ReportTable>
              <Table>
                <TableHeader>
              <TableRow className={isDark ? "border-red-500/20 hover:bg-transparent" : "border-red-200"}>
                <TableHead className={head}>نام</TableHead>
                <TableHead className={head}>دسته‌بندی</TableHead>
                <TableHead className={head}>موجودی فعلی</TableHead>
                <TableHead className={head}>حداقل موجودی</TableHead>
                <TableHead className={head}>واحد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((item: any) => (
                <TableRow key={item.id} className={isDark ? "border-red-500/10 hover:bg-neutral-800" : "border-red-100 hover:bg-red-50"}>
                  <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{item.name}</TableCell>
                  <TableCell className={cell}>{item.category}</TableCell>
                  <TableCell className={cn("font-semibold", isDark ? "text-red-400" : "text-red-600")}>{toPersianDigits((item.current_stock || 0).toString())}</TableCell>
                  <TableCell className={cell}>{toPersianDigits((item.min_stock || 0).toString())}</TableCell>
                  <TableCell className={cell}>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </ReportTable>
        </ReportTableShell>
      )}

      {rawMaterials?.length > 0 && (
        <ReportTableShell title="موجودی مواد اولیه" isDark={isDark}>
          <ReportTable>
              <Table>
                <TableHeader>
              <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                <TableHead className={head}>نام</TableHead>
                <TableHead className={head}>دسته</TableHead>
                <TableHead className={head}>موجودی</TableHead>
                <TableHead className={head}>واحد</TableHead>
                <TableHead className={head}>قیمت</TableHead>
                <TableHead className={head}>ارزش</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawMaterials.map((item: any) => {
                    const value = (item.current_stock || 0) * (item.price || 0);
                const isLow = item.current_stock <= item.min_stock;
                    return (
                  <TableRow key={item.id} className={cn(row, isLow && (isDark ? "bg-red-900/20" : "bg-red-50/50"))}>
                    <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{item.name}</TableCell>
                    <TableCell className={cell}>{item.category}</TableCell>
                    <TableCell className={cn("font-semibold", isLow ? (isDark ? "text-red-400" : "text-red-600") : (isDark ? "text-white" : "text-gray-900"))}>
                          {toPersianDigits((item.current_stock || 0).toString())}
                        </TableCell>
                    <TableCell className={cell}>{item.unit}</TableCell>
                    <TableCell className={cell}>{formatToman(item.price || 0)}</TableCell>
                    <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>{formatToman(value)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          </ReportTable>
        </ReportTableShell>
      )}

      {categoryBreakdown?.length > 0 && (
        <ReportTableShell title="موجودی بر اساس دسته‌بندی" isDark={isDark}>
          <ReportTable>
              <Table>
                <TableHeader>
              <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                <TableHead className={head}>دسته‌بندی</TableHead>
                <TableHead className={head}>تعداد آیتم</TableHead>
                <TableHead className={head}>ارزش کل</TableHead>
                <TableHead className={head}>کم‌موجودی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.map((cat: any, index: number) => (
                <TableRow key={cat.category || index} className={row}>
                  <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{cat.category}</TableCell>
                  <TableCell className={cell}>{toPersianDigits((cat.itemCount || 0).toString())}</TableCell>
                  <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>{formatToman(cat.totalValue || 0)}</TableCell>
                  <TableCell className={cn(cat.lowStockCount > 0 ? (isDark ? "text-red-400" : "text-red-600") : cell)}>
                        {toPersianDigits((cat.lowStockCount || 0).toString())}
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
