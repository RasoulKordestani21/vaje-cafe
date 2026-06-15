"use client";

import React from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Coffee,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users
} from "lucide-react";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { AdminCharts } from "@/components/AdminCharts";
import { AdminStatCard } from "@/components/dashboard/AdminStatCard";
import { formatToman, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  adminCard,
  adminTextPrimary,
  adminTextMuted
} from "@/lib/adminTheme";

interface DateRange {
  from: string;
  to: string;
}

interface DashboardStatsProps {
  stats: any;
  dateRange: DateRange;
  onDateRangeChange: React.Dispatch<React.SetStateAction<DateRange>>;
  isDark: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  dateRange,
  onDateRangeChange,
  isDark
}) => {
  const cardClass = cn("p-5 rounded-2xl border", adminCard(isDark));

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div
        className={cn(
          cardClass,
          "flex flex-col md:flex-row gap-4 md:items-end"
        )}
      >
        <div className="flex-1 w-full">
          <ScrollingJalaliDatePicker
            value={dateRange.from}
            onChange={value =>
              onDateRangeChange(prev => ({ ...prev, from: value }))
            }
            label="از تاریخ"
            isDark={isDark}
          />
        </div>
        <div className="flex-1 w-full">
          <ScrollingJalaliDatePicker
            value={dateRange.to}
            onChange={value =>
              onDateRangeChange(prev => ({ ...prev, to: value }))
            }
            label="تا تاریخ"
            isDark={isDark}
          />
        </div>
        <button
          type="button"
          onClick={() => onDateRangeChange({ from: "", to: "" })}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium shrink-0",
            isDark
              ? "bg-white/5 hover:bg-white/10 text-gray-300"
              : "bg-admin-muted border border-admin-border text-admin-secondary hover:bg-slate-200/70"
          )}
        >
          بازنشانی
        </button>
      </div>

      {/* KPI Cards: mobile 2 → tablet 3 → desktop 4 (mobile-first) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="فروش کل"
          value={formatToman(stats.totalSales)}
          sublabel="تومان"
          icon={DollarSign}
          iconBg={isDark ? "bg-emerald-500/15" : "bg-emerald-50"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          isDark={isDark}
        />
        <AdminStatCard
          label="تعداد سفارشات"
          value={toPersianDigits(stats.ordersCount?.toString() ?? "0")}
          sublabel="سفارش"
          icon={ShoppingBag}
          iconBg={isDark ? "bg-blue-500/15" : "bg-blue-50"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          isDark={isDark}
        />
        <AdminStatCard
          label="بازدید سایت"
          value={toPersianDigits(stats.visits?.toString() ?? "0")}
          sublabel="بازدید"
          icon={Users}
          iconBg={isDark ? "bg-violet-500/15" : "bg-violet-50"}
          iconColor={isDark ? "text-violet-400" : "text-violet-600"}
          isDark={isDark}
        />
        <AdminStatCard
          label="بازدید منو"
          value={toPersianDigits(stats.menuViews?.toString() ?? "0")}
          sublabel="بازدید"
          icon={Coffee}
          iconBg={isDark ? "bg-amber-500/15" : "bg-amber-50"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          isDark={isDark}
        />
      </div>

      {/* Comparison + avg — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.comparisonData && (
          <>
            <div className={cardClass}>
              <h3 className={cn("text-sm font-bold mb-4", adminTextPrimary(isDark))}>
                امروز در مقابل دیروز
              </h3>
              <div className="space-y-3">
                <ComparisonRow
                  label="سفارشات"
                  value={toPersianDigits(
                    stats.comparisonData.todayVsYesterday.orders.toString()
                  )}
                  change={stats.comparisonData.todayVsYesterday.ordersChange}
                  isDark={isDark}
                />
                <ComparisonRow
                  label="فروش"
                  value={formatToman(stats.comparisonData.todayVsYesterday.sales)}
                  change={stats.comparisonData.todayVsYesterday.salesChange}
                  isDark={isDark}
                />
              </div>
            </div>
            <div className={cardClass}>
              <h3 className={cn("text-sm font-bold mb-4", adminTextPrimary(isDark))}>
                این هفته در مقابل هفته گذشته
              </h3>
              <div className="space-y-3">
                <ComparisonRow
                  label="سفارشات"
                  value={toPersianDigits(
                    stats.comparisonData.thisWeekVsLastWeek.orders.toString()
                  )}
                  change={stats.comparisonData.thisWeekVsLastWeek.ordersChange}
                  isDark={isDark}
                />
                <ComparisonRow
                  label="فروش"
                  value={formatToman(
                    stats.comparisonData.thisWeekVsLastWeek.sales
                  )}
                  change={stats.comparisonData.thisWeekVsLastWeek.salesChange}
                  isDark={isDark}
                />
              </div>
            </div>
          </>
        )}
        {stats.averageOrderValue > 0 && (
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center",
                  isDark ? "bg-purple-500/15" : "bg-purple-50"
                )}
              >
                <BarChart3
                  size={22}
                  className={isDark ? "text-purple-400" : "text-purple-600"}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}
                >
                  میانگین ارزش سفارش
                </p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {formatToman(stats.averageOrderValue)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top sellers — 3 column cards */}
      {stats.topSellingItems && stats.topSellingItems.length > 0 && (
        <div>
          <h3 className={cn("text-sm font-bold mb-4", adminTextPrimary(isDark))}>
            پرفروش‌ترین آیتم‌ها
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topSellingItems.slice(0, 6).map((item: any, index: number) => (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-3",
                  adminCard(isDark)
                )}
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                    index === 0
                      ? isDark
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-yellow-50 text-yellow-600"
                      : index === 1
                        ? isDark
                          ? "bg-gray-500/20 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                        : index === 2
                          ? isDark
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-amber-50 text-amber-600"
                          : isDark
                            ? "bg-white/5 text-gray-400"
                            : "bg-admin-muted text-admin-secondary"
                  )}
                >
                  {toPersianDigits((index + 1).toString())}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm truncate", adminTextPrimary(isDark))}>
                    {item.name}
                  </p>
                  <p className={cn("text-xs mt-0.5", adminTextMuted(isDark))}>
                    {toPersianDigits(item.quantity.toString())} عدد
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold shrink-0",
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  )}
                >
                  {formatToman(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <AdminCharts stats={stats} />
    </div>
  );
};

function ComparisonRow({
  label,
  value,
  change,
  isDark
}: {
  label: string;
  value: string;
  change: number;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", adminTextMuted(isDark))}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={cn("font-bold text-sm", adminTextPrimary(isDark))}>
          {value}
        </span>
        {change !== 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              change > 0 ? "text-emerald-500" : "text-red-500"
            )}
          >
            {change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(Math.round(change))}%
          </span>
        )}
      </div>
    </div>
  );
}

export default DashboardStats;
