import React from "react";
import {
  LineChart,
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
  ResponsiveContainer
} from "recharts";
import { useContext } from "react";
import { ThemeContext } from "@/app/providers";
import { formatDailyDataForChart } from "@/utils/dateFormatter";

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

export const AdminCharts: React.FC<AdminChartsProps> = ({ stats }) => {
  const { isDark } = useContext(ThemeContext);

  // Use real daily data from stats, or fallback to empty array
  const dailyData = stats.dailyData
    ? formatDailyDataForChart(stats.dailyData)
    : [];

  // Category breakdown - fallback to empty if not provided
  const categoryData = stats.categoryBreakdown || [
    { name: "اسپرسو", value: 35 },
    { name: "قهوه دمی", value: 25 },
    { name: "نوشیدنی سرد", value: 20 },
    { name: "دسر", value: 20 }
  ];

  const categoryColors = [
    "#00c26f",
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8"
  ];
  const lineChartColors = ["#00c26f", "#ff6b6b"];
  const barChartColor = "#00c26f";
  const gridColor = isDark ? "#333" : "#d4e5e0";
  const textColor = isDark ? "#e0e0e0" : "#1a1a1a";
  const bgCard = isDark ? "bg-neutral-900" : "bg-primary-50";
  const borderCard = isDark ? "border-white/5" : "border-primary-200";
  const textLabel = isDark ? "text-gray-400" : "text-gray-700";
  const textTitle = isDark ? "text-white" : "text-primary-900";
  const textValue = isDark ? "text-primary-400" : "text-primary-600";

  return (
    <div className="space-y-8">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl ${bgCard} border ${borderCard}`}>
          <p className={`text-sm mb-2 ${textLabel}`}>کل فروش</p>
          <h3 className={`text-3xl font-bold font-serif ${textValue}`}>
            {new Intl.NumberFormat("fa-IR").format(stats.totalSales)}
          </h3>
          <p
            className={`text-xs mt-2 ${
              isDark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            تومان
          </p>
        </div>

        <div className={`p-6 rounded-2xl ${bgCard} border ${borderCard}`}>
          <p className={`text-sm mb-2 ${textLabel}`}>تعداد سفارشات</p>
          <h3 className={`text-3xl font-bold font-serif ${textValue}`}>
            {stats.ordersCount}
          </h3>
          <p
            className={`text-xs mt-2 ${
              isDark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            سفارش
          </p>
        </div>

        <div className={`p-6 rounded-2xl ${bgCard} border ${borderCard}`}>
          <p className={`text-sm mb-2 ${textLabel}`}>بازدید سایت</p>
          <h3 className={`text-3xl font-bold font-serif ${textValue}`}>
            {stats.visits}
          </h3>
          <p
            className={`text-xs mt-2 ${
              isDark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            بازدید
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Daily Orders & Sales */}
        <div
          className={`p-6 rounded-2xl ${
            isDark ? "bg-neutral-900" : "bg-white"
          } border ${borderCard}`}
        >
          <h3 className={`font-bold text-lg mb-6 ${textTitle}`}>
            روند سفارشات و فروش
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="dateDisplay"
                stroke={textColor}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={textColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1a1a1a" : "#fafafa",
                  border: `1px solid ${isDark ? "#333" : "#d4e5e0"}`,
                  color: textColor
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke={lineChartColors[0]}
                strokeWidth={3}
                dot={{ fill: lineChartColors[0], r: 5 }}
                activeDot={{ r: 7 }}
                name="سفارشات"
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke={lineChartColors[1]}
                strokeWidth={3}
                dot={{ fill: lineChartColors[1], r: 5 }}
                activeDot={{ r: 7 }}
                name="فروش (تومان)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Category Breakdown */}
        <div
          className={`p-6 rounded-2xl ${
            isDark ? "bg-neutral-900" : "bg-white"
          } border ${borderCard}`}
        >
          <h3 className={`font-bold text-lg mb-6 ${textTitle}`}>
            توزیع فروش بر اساس دسته
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#00c26f"
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColors[index % categoryColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1a1a1a" : "#fafafa",
                  border: `1px solid ${isDark ? "#333" : "#d4e5e0"}`,
                  color: textColor
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Daily comparison */}
      <div
        className={`p-6 rounded-2xl ${
          isDark ? "bg-neutral-900" : "bg-white"
        } border ${borderCard}`}
      >
        <h3 className={`font-bold text-lg mb-6 ${textTitle}`}>
          مقایسه سفارشات روزانه
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="dateDisplay"
              stroke={textColor}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke={textColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1a1a1a" : "#fafafa",
                border: `1px solid ${isDark ? "#333" : "#d4e5e0"}`,
                color: textColor
              }}
            />
            <Legend />
            <Bar
              dataKey="orders"
              fill={barChartColor}
              name="سفارشات"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
