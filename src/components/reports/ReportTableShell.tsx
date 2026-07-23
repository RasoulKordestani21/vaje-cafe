"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReportTableShellProps {
  title: string;
  subtitle?: string;
  isDark?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function ReportTableShell({
  title,
  subtitle,
  isDark,
  children,
  className,
  headerClassName,
}: ReportTableShellProps) {
  return (
    <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200", className)} dir="rtl">
      <CardHeader className={cn("pb-3 text-right", headerClassName)}>
        <CardTitle className={cn("text-base sm:text-lg", isDark ? "text-white" : "text-gray-900")}>
          {title}
        </CardTitle>
        {subtitle && (
          <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto -mx-px" dir="rtl">
          <div className="min-w-[560px] px-4 sm:px-0 pb-4 sm:pb-0 [&_table]:text-right [&_th]:text-right [&_td]:text-right">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const reportHeadClass = (isDark?: boolean) =>
  cn(
    "text-right whitespace-nowrap !text-right",
    isDark ? "text-gray-400" : "text-gray-600"
  );

export const reportCellClass = (isDark?: boolean) =>
  cn("text-right", isDark ? "text-gray-300" : "text-gray-700");

export const reportRowClass = (isDark?: boolean) =>
  isDark ? "border-white/10 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50";

/** Wrap shadcn Table with RTL direction */
export function ReportTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div dir="rtl" className={cn("[&_table]:w-full [&_th]:text-right [&_td]:text-right", className)}>
      {children}
    </div>
  );
}
