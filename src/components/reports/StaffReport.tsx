"use client";

import React from "react";
import { Users, CheckCircle, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";
import { useReportData, type DateRange } from "./useReportData";
import { ReportLoadingState, ReportErrorState } from "./ReportStates";
import { ReportSummaryCard, ReportSummaryGrid } from "./ReportSummaryCard";
import { ReportTableShell, ReportTable, reportHeadClass, reportCellClass, reportRowClass } from "./ReportTableShell";

interface StaffReportProps {
  dateRange: DateRange;
  isDark?: boolean;
}

function roleLabel(role: string): string {
  if (role === "waiter") return "گارسون";
  if (role === "barista") return "باریستا";
  if (role === "manager") return "مدیر";
  return role;
}

export default function StaffReport({ dateRange, isDark = false }: StaffReportProps) {
  const { loading, error, data, refetch } = useReportData<any>("/api/reports/staff", dateRange);

  if (loading) return <ReportLoadingState isDark={isDark} />;
  if (error) return <ReportErrorState message={error} onRetry={refetch} isDark={isDark} />;
  if (!data) return null;

  const { staff, roleSummary, totals } = data;
  const head = reportHeadClass(isDark);
  const cell = reportCellClass(isDark);
  const row = reportRowClass(isDark);

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <ReportSummaryGrid>
        <ReportSummaryCard label="کل پرسنل" value={toPersianDigits((totals.totalStaff || 0).toString())} icon={Users} iconClassName={isDark ? "text-blue-400" : "text-blue-600"} isDark={isDark} />
        <ReportSummaryCard label="پرسنل فعال" value={toPersianDigits((totals.activeStaff || 0).toString())} icon={Activity} iconClassName={isDark ? "text-green-400" : "text-green-600"} isDark={isDark} />
        <ReportSummaryCard label="نقش‌ها" value={toPersianDigits((roleSummary?.length || 0).toString())} icon={CheckCircle} iconClassName={isDark ? "text-purple-400" : "text-purple-600"} isDark={isDark} />
      </ReportSummaryGrid>

      {roleSummary?.length > 0 && (
        <ReportTableShell title="خلاصه بر اساس نقش" isDark={isDark}>
          <ReportTable>
            <Table>
            <TableHeader>
              <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                <TableHead className={head}>نقش</TableHead>
                <TableHead className={head}>تعداد کل</TableHead>
                <TableHead className={head}>فعال</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleSummary.map((r: any, index: number) => (
                <TableRow key={r.role || index} className={row}>
                  <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{roleLabel(r.role)}</TableCell>
                  <TableCell className={cell}>{toPersianDigits((r.count || 0).toString())}</TableCell>
                  <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>{toPersianDigits((r.activeCount || 0).toString())}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </ReportTable>
        </ReportTableShell>
      )}

      {staff?.length > 0 && (
        <ReportTableShell
          title="عملکرد پرسنل"
          subtitle={`${toPersianDigits(staff.length.toString())} نفر`}
          isDark={isDark}
        >
          <ReportTable>
            <Table>
            <TableHeader>
              <TableRow className={isDark ? "border-white/10 hover:bg-transparent" : "border-gray-200"}>
                <TableHead className={head}>نام</TableHead>
                <TableHead className={head}>ایمیل</TableHead>
                <TableHead className={head}>نقش</TableHead>
                <TableHead className={head}>عملیات سفارش</TableHead>
                <TableHead className={head}>اعلان‌ها</TableHead>
                <TableHead className={head}>نرخ خواندن</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member: any) => (
                <TableRow key={member.staffId} className={row}>
                  <TableCell className={cn("font-medium whitespace-nowrap", isDark ? "text-white" : "text-gray-900")}>{member.name}</TableCell>
                  <TableCell className={cn(cell, "max-w-[140px] truncate")}>{member.email}</TableCell>
                  <TableCell className={cell}>{roleLabel(member.role)}</TableCell>
                  <TableCell className={cell}>{toPersianDigits((member.orderActions || 0).toString())}</TableCell>
                  <TableCell className={cell}>{toPersianDigits((member.totalNotifications || 0).toString())}</TableCell>
                  <TableCell className={cn(
                    "font-semibold",
                    member.notificationReadRate >= 80 ? (isDark ? "text-green-400" : "text-green-600")
                      : member.notificationReadRate >= 50 ? (isDark ? "text-yellow-400" : "text-yellow-600")
                      : (isDark ? "text-red-400" : "text-red-600")
                  )}>
                    {toPersianDigits((member.notificationReadRate || 0).toString())}٪
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
