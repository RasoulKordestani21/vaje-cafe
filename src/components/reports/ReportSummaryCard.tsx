"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ReportSummaryCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  isDark?: boolean;
}

export function ReportSummaryCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  isDark,
}: ReportSummaryCardProps) {
  return (
    <Card className={cn(isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")} dir="rtl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 flex-row-reverse">
          <div className="min-w-0 text-right flex-1">
            <p className={cn("text-xs sm:text-sm truncate", isDark ? "text-gray-400" : "text-gray-600")}>
              {label}
            </p>
            <p className={cn("text-xl sm:text-2xl font-bold mt-1 truncate tabular-nums", isDark ? "text-white" : "text-gray-900")}>
              {value}
            </p>
          </div>
          <Icon size={28} className={cn("shrink-0", iconClassName)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportSummaryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" dir="rtl">
      {children}
    </div>
  );
}
