"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCard, adminTextPrimary, adminTextMuted } from "@/lib/adminTheme";
import { toPersianDigits } from "@/utils/format";

interface AdminStatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; label?: string };
  isDark?: boolean;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  isDark = true
}) => {
  return (
    <div
      className={cn(
        "p-5 rounded-2xl border transition-shadow",
        adminCard(isDark)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          <Icon size={22} className={iconColor} />
        </div>
        {trend && trend.value !== 0 && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.value > 0
                ? isDark
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-emerald-50 text-emerald-600"
                : isDark
                  ? "bg-red-500/15 text-red-400"
                  : "bg-red-50 text-red-600"
            )}
          >
            {trend.value > 0 ? "+" : ""}
            {toPersianDigits(Math.abs(Math.round(trend.value)).toString())}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={cn("text-sm mb-1", adminTextMuted(isDark))}>
          {label}
        </p>
        <p className={cn("text-2xl font-bold tracking-tight", adminTextPrimary(isDark))}>
          {value}
        </p>
        {sublabel && (
          <p className={cn("text-xs mt-1", adminTextMuted(isDark))}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminStatCard;
