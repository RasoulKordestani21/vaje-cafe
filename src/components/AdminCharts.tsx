import React from "react";
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from "recharts";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import { formatDailyDataForChart } from "@/utils/dateFormatter";
import { formatToman, toPersianDigits } from "@/utils/format";
import { adminCard, adminTextPrimary } from "@/lib/adminTheme";
import { cn } from "@/lib/utils";

interface ChartData {
  visits: number;
  totalSales: number;
  ordersCount: number;
  dailyData?: Array<{
    date: string;
    orders: number;
    sales: number;
    visits?: number;
  }>;
  categoryBreakdown?: Array<{ name: string; value: number }>;
}

interface AdminChartsProps {
  stats: ChartData;
}

const CATEGORY_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6"
];

export const AdminCharts: React.FC<AdminChartsProps> = ({ stats }) => {
  const { isDark } = useContext(ThemeContext);

  const dailyData = stats.dailyData
    ? formatDailyDataForChart(stats.dailyData)
    : [];

  const categoryData = (stats.categoryBreakdown || []).filter(d => d.value > 0);
  const categoryTotal = categoryData.reduce((sum, d) => sum + d.value, 0);
  const hasCategoryData = categoryData.length > 0;

  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)";
  const textColor = isDark ? "#9ca3af" : "#64748b";
  const tooltipStyle = {
    backgroundColor: isDark ? "#1a1d24" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#c5ced9"}`,
    borderRadius: "12px",
    color: isDark ? "#f3f4f6" : "#0f172a",
    fontSize: "13px",
    boxShadow: isDark
      ? "0 8px 24px rgba(0,0,0,0.3)"
      : "0 4px 16px rgba(15,23,42,0.12)"
  };

  const cardClass = cn("p-6 rounded-2xl border", adminCard(isDark));
  const titleClass = adminTextPrimary(isDark);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyle} className="px-3 py-2.5 space-y-1">
        <p className="font-semibold text-sm mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}:{" "}
            {entry.dataKey === "sales"
              ? formatToman(entry.value)
              : toPersianDigits(String(entry.value))}
          </p>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    const pct = categoryTotal > 0 ? (value / categoryTotal) * 100 : 0;
    return (
      <div style={tooltipStyle} className="px-3 py-2.5 space-y-1">
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs">{formatToman(value)}</p>
        <p className="text-xs opacity-80">
          {toPersianDigits(pct.toFixed(1))}٪ از کل
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & orders trend */}
        <div className={cn(cardClass, "lg:col-span-2")}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold text-base ${titleClass}`}>
              روند سفارشات و فروش
            </h3>
            <span
              className={`text-xs px-2.5 py-1 rounded-full ${
                isDark
                  ? "bg-white/5 text-gray-400"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              ۷ روز اخیر
            </span>
          </div>
          {dailyData.length === 0 ? (
            <div
              className={`h-[280px] flex items-center justify-center text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              داده‌ای برای نمایش وجود ندارد
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="dateDisplay"
                  stroke={textColor}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="orders"
                  stroke={textColor}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={36}
                />
                <YAxis
                  yAxisId="sales"
                  orientation="right"
                  stroke={textColor}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${toPersianDigits(String(Math.round(v / 1_000_000)))}M`
                      : v >= 1_000
                        ? `${toPersianDigits(String(Math.round(v / 1_000)))}K`
                        : toPersianDigits(String(v))
                  }
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
                  formatter={value => (
                    <span style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                      {value}
                    </span>
                  )}
                />
                <Area
                  yAxisId="sales"
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  name="فروش (تومان)"
                  dot={false}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="سفارشات"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category donut */}
        <div className={cardClass}>
          <h3 className={`font-bold text-base mb-6 ${titleClass}`}>
            توزیع فروش بر اساس دسته
          </h3>
          {!hasCategoryData ? (
            <div
              className={`h-[260px] flex items-center justify-center text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              داده‌ای برای نمایش وجود ندارد
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="42%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", lineHeight: "1.8", paddingRight: 8 }}
                  formatter={value => (
                    <span style={{ color: isDark ? "#d1d5db" : "#374151" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily orders bar */}
        <div className={cardClass}>
          <h3 className={`font-bold text-base mb-6 ${titleClass}`}>
            مقایسه سفارشات روزانه
          </h3>
          {dailyData.length === 0 ? (
            <div
              className={`h-[260px] flex items-center justify-center text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              داده‌ای برای نمایش وجود ندارد
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="dateDisplay"
                  stroke={textColor}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke={textColor}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="orders"
                  fill="#10b981"
                  name="سفارشات"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
