"use client";

import React from "react";
import {
    ArrowDown,
    ArrowUp,
    BarChart3,
    Coffee,
    DollarSign,
    TrendingUp,
    Users
  } from "lucide-react";
import ScrollingJalaliDatePicker from "@/components/ScrollingJalaliDatePicker";
import { AdminCharts } from "@/components/AdminCharts";
import { formatToman, toPersianDigits } from "@/utils/format";

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
  return (
    <div className="space-y-8">
      {/* Date Range Filter */}
      <div
        className={`p-4 rounded-2xl border flex flex-row sm:flex-col gap-4 items-end ${
          isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
        }`}
      >
        <div className="flex-1">
          <ScrollingJalaliDatePicker
            value={dateRange.from}
            onChange={value =>
              onDateRangeChange(prev => ({ ...prev, from: value }))
            }
            label="از تاریخ"
            isDark={isDark}
          />
        </div>
        <div className="flex-1">
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
          onClick={() => onDateRangeChange({ from: "", to: "" })}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isDark
              ? "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
          }`}
        >
          بازنشانی
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div
          className={`p-6 rounded-2xl border shadow-lg flex items-center gap-4 ${
            isDark
              ? "bg-neutral-900 border-white/5"
              : "bg-white border-emerald-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark
                ? "bg-emerald-900/30 text-emerald-500"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <p
              className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              فروش کل
            </p>
            <h3
              className={`text-2xl font-bold font-serif ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {formatToman(stats.totalSales)}
            </h3>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              تومان
            </p>
          </div>
        </div>

        {/* Orders Count */}
        <div
          className={`p-6 rounded-2xl border shadow-lg flex items-center gap-4 ${
            isDark
              ? "bg-neutral-900 border-white/5"
              : "bg-white border-blue-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark
                ? "bg-blue-900/30 text-blue-500"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <p
              className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              تعداد سفارشات
            </p>
            <h3
              className={`text-2xl font-bold font-serif ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {toPersianDigits(stats.ordersCount)}
            </h3>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              سفارش
            </p>
          </div>
        </div>

        {/* Visits */}
        <div
          className={`p-6 rounded-2xl border shadow-lg flex items-center gap-4 ${
            isDark
              ? "bg-neutral-900 border-white/5"
              : "bg-white border-purple-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark
                ? "bg-purple-900/30 text-purple-500"
                : "bg-purple-100 text-purple-600"
            }`}
          >
            <Users size={24} />
          </div>
          <div>
            <p
              className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              بازدید سایت
            </p>
            <h3
              className={`text-2xl font-bold font-serif ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {toPersianDigits(stats.visits)}
            </h3>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              بازدید
            </p>
          </div>
        </div>

        {/* Menu Views */}
        <div
          className={`p-6 rounded-2xl border shadow-lg flex items-center gap-4 ${
            isDark
              ? "bg-neutral-900 border-white/5"
              : "bg-white border-amber-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark
                ? "bg-amber-900/30 text-amber-500"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            <Coffee size={24} />
          </div>
          <div>
            <p
              className={`text-sm mb-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              بازدید منو
            </p>
            <h3
              className={`text-2xl font-bold font-serif ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {toPersianDigits(stats.menuViews)}
            </h3>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              بازدید
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      {stats.comparisonData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today vs Yesterday */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? "bg-neutral-900 border-white/5"
                : "bg-white border-gray-300"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              امروز در مقابل دیروز
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  سفارشات
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {toPersianDigits(
                      stats.comparisonData.todayVsYesterday.orders.toString()
                    )}
                  </span>
                  {stats.comparisonData.todayVsYesterday.ordersChange !== 0 && (
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        stats.comparisonData.todayVsYesterday.ordersChange > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {stats.comparisonData.todayVsYesterday.ordersChange > 0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      {Math.abs(
                        Math.round(
                          stats.comparisonData.todayVsYesterday.ordersChange
                        )
                      )}
                      %
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  فروش
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formatToman(
                      stats.comparisonData.todayVsYesterday.sales
                    )}
                  </span>
                  {stats.comparisonData.todayVsYesterday.salesChange !== 0 && (
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        stats.comparisonData.todayVsYesterday.salesChange > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {stats.comparisonData.todayVsYesterday.salesChange > 0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      {Math.abs(
                        Math.round(
                          stats.comparisonData.todayVsYesterday.salesChange
                        )
                      )}
                      %
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* This Week vs Last Week */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark
                ? "bg-neutral-900 border-white/5"
                : "bg-white border-gray-300"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              این هفته در مقابل هفته گذشته
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  سفارشات
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {toPersianDigits(
                      stats.comparisonData.thisWeekVsLastWeek.orders.toString()
                    )}
                  </span>
                  {stats.comparisonData.thisWeekVsLastWeek.ordersChange !==
                    0 && (
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        stats.comparisonData.thisWeekVsLastWeek.ordersChange > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {stats.comparisonData.thisWeekVsLastWeek.ordersChange >
                      0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      {Math.abs(
                        Math.round(
                          stats.comparisonData.thisWeekVsLastWeek.ordersChange
                        )
                      )}
                      %
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  فروش
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formatToman(
                      stats.comparisonData.thisWeekVsLastWeek.sales
                    )}
                  </span>
                  {stats.comparisonData.thisWeekVsLastWeek.salesChange !==
                    0 && (
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        stats.comparisonData.thisWeekVsLastWeek.salesChange > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {stats.comparisonData.thisWeekVsLastWeek.salesChange >
                      0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      {Math.abs(
                        Math.round(
                          stats.comparisonData.thisWeekVsLastWeek.salesChange
                        )
                      )}
                      %
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Average Order Value Card */}
      {stats.averageOrderValue > 0 && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark
              ? "bg-neutral-900 border-white/5"
              : "bg-white border-gray-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDark
                  ? "bg-purple-900/30 text-purple-500"
                  : "bg-purple-100 text-purple-600"
              }`}
            >
              <BarChart3 size={24} />
            </div>
            <div>
              <p
                className={`text-sm mb-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                میانگین ارزش سفارش
              </p>
              <h3
                className={`text-2xl font-bold font-serif ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {formatToman(stats.averageOrderValue)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Top Selling Items */}
      {stats.topSellingItems && stats.topSellingItems.length > 0 && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark
              ? "bg-neutral-900 border-white/5"
              : "bg-white border-gray-300"
          }`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            پرفروش‌ترین آیتم‌ها
          </h3>
          <div className="space-y-3">
            {stats.topSellingItems.slice(0, 5).map((item: any, index: number) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : index === 1
                        ? "bg-gray-500/20 text-gray-400"
                        : index === 2
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-neutral-700 text-gray-400"
                    }`}
                  >
                    {toPersianDigits((index + 1).toString())}
                  </span>
                  <span
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {toPersianDigits(item.quantity.toString())} عدد
                  </span>
                  <span
                    className={`font-bold ${
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  >
                    {formatToman(item.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <AdminCharts stats={stats} />
    </div>
  );
};

export default DashboardStats;





