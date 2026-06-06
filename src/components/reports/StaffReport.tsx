"use client";

import React, { useState, useEffect } from "react";
import { Users, CheckCircle, Bell, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";
import { jalaliToTimestamp } from "@/utils/jalaliDateUtils";

interface StaffReportProps {
  dateRange: { from: string; to: string };
  isDark?: boolean;
}

export default function StaffReport({ dateRange, isDark = false }: StaffReportProps) {
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

      const response = await fetch(`/api/reports/staff?${params.toString()}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching staff report:", error);
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

  const { staff, roleSummary, totals } = reportData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  کل پرسنل
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.totalStaff || 0).toString())}
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
                  پرسنل فعال
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((totals.activeStaff || 0).toString())}
                </p>
              </div>
              <Activity size={32} className={cn(isDark ? "text-green-400" : "text-green-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                  نقش‌ها
                </p>
                <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
                  {toPersianDigits((roleSummary?.length || 0).toString())}
                </p>
              </div>
              <CheckCircle size={32} className={cn(isDark ? "text-purple-400" : "text-purple-600")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Summary */}
      {roleSummary && roleSummary.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              خلاصه بر اساس نقش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نقش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>تعداد کل</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>فعال</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleSummary.map((role: any, index: number) => (
                    <TableRow
                      key={role.role || index}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {role.role === "waiter" ? "گارسون" : 
                         role.role === "barista" ? "بارista" : 
                         role.role === "manager" ? "مدیر" : role.role}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((role.count || 0).toString())}
                      </TableCell>
                      <TableCell className={cn("font-semibold", isDark ? "text-green-400" : "text-green-600")}>
                        {toPersianDigits((role.activeCount || 0).toString())}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Performance */}
      {staff && staff.length > 0 && (
        <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <CardHeader>
            <CardTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
              عملکرد پرسنل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-white/10" : "border-gray-200"}>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نام</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>ایمیل</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نقش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>عملیات سفارش</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>اعلان‌ها</TableHead>
                    <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>نرخ خواندن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member: any) => (
                    <TableRow
                      key={member.staffId}
                      className={isDark ? "border-white/5 hover:bg-neutral-800" : "border-gray-200 hover:bg-gray-50"}
                    >
                      <TableCell className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                        {member.name}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {member.email}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {member.role === "waiter" ? "گارسون" : 
                         member.role === "barista" ? "بارista" : 
                         member.role === "manager" ? "مدیر" : member.role}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((member.orderActions || 0).toString())}
                      </TableCell>
                      <TableCell className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {toPersianDigits((member.totalNotifications || 0).toString())}
                      </TableCell>
                      <TableCell className={cn(
                        "font-semibold",
                        member.notificationReadRate >= 80 
                          ? (isDark ? "text-green-400" : "text-green-600")
                          : member.notificationReadRate >= 50
                          ? (isDark ? "text-yellow-400" : "text-yellow-600")
                          : (isDark ? "text-red-400" : "text-red-600")
                      )}>
                        {toPersianDigits((member.notificationReadRate || 0).toString())}%
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


