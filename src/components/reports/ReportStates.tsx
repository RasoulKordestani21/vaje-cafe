"use client";

import React from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReportLoadingState({ isDark }: { isDark?: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center py-20 gap-3">
      <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
        در حال بارگذاری گزارش...
      </p>
    </div>
  );
}

export function ReportErrorState({
  message,
  onRetry,
  isDark,
}: {
  message: string;
  onRetry?: () => void;
  isDark?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 rounded-xl border text-center gap-3",
      isDark ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-200"
    )}>
      <AlertCircle className={cn("w-10 h-10", isDark ? "text-red-400" : "text-red-500")} />
      <p className={cn("text-sm max-w-md", isDark ? "text-red-300" : "text-red-700")}>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw size={14} />
          تلاش مجدد
        </Button>
      )}
    </div>
  );
}

export function ReportEmptyState({
  message = "داده‌ای برای نمایش وجود ندارد",
  isDark,
}: {
  message?: string;
  isDark?: boolean;
}) {
  return (
    <div className={cn(
      "text-center py-16 rounded-xl border border-dashed",
      isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-500"
    )}>
      {message}
    </div>
  );
}
