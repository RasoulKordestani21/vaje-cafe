"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  Clock,
  Users,
  Building2,
  Settings,
  Image,
  DollarSign,
  Star,
  MessageSquareText,
  History,
  FileText,
  Trash2,
  Images,
  BookOpen,
  Gift,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

export type DashboardPage =
  | "dashboard"
  | "menu"
  | "orders"
  | "inventory"
  | "customer-orders"
  | "branches"
  | "customers"
  | "settings"
  | "banners"
  | "working-hours"
  | "expenses"
  | "ratings"
  | "customer-messages"
  | "staff"
  | "stats"
  | "reports"
  | "waste"
  | "gallery"
  | "stories"
  | "experience-comments"
  | "loyalty";

interface NavItem {
  id: DashboardPage;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  role?: "admin" | "super_admin" | "all";
  group?: string;
}

interface DashboardSidebarProps {
  isDark: boolean;
  userRole: "admin" | "super_admin" | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingOrdersCount?: number;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "داشبورد",
    icon: <LayoutDashboard size={20} />,
    role: "all",
    group: "main",
  },
  {
    id: "orders",
    label: "سفارشات",
    icon: <Clock size={20} />,
    role: "all",
    group: "main",
  },
  {
    id: "menu",
    label: "مدیریت منو",
    icon: <Coffee size={20} />,
    role: "all",
    group: "main",
  },
  {
    id: "customer-orders",
    label: "سفارشات مشتری",
    icon: <Users size={20} />,
    role: "all",
    group: "main",
  },
  {
    id: "customers",
    label: "مشتریان",
    icon: <Users size={20} />,
    role: "super_admin",
    group: "management",
  },
  {
    id: "expenses",
    label: "هزینه‌ها",
    icon: <DollarSign size={20} />,
    role: "all",
    group: "management",
  },
  {
    id: "ratings",
    label: "نظرات و امتیازها",
    icon: <Star size={20} />,
    role: "all",
    group: "management",
  },
  {
    id: "customer-messages",
    label: "پیام‌های مشتریان",
    icon: <MessageSquareText size={20} />,
    role: "all",
    group: "management",
  },
  {
    id: "gallery",
    label: "گالری تصاویر",
    icon: <Images size={20} />,
    role: "all",
    group: "content",
  },
  {
    id: "stories",
    label: "استوری‌ها",
    icon: <BookOpen size={20} />,
    role: "all",
    group: "content",
  },
  {
    id: "experience-comments",
    label: "نظرات تجربه",
    icon: <MessageSquareText size={20} />,
    role: "all",
    group: "content",
  },
  {
    id: "loyalty",
    label: "برنامه وفاداری",
    icon: <Gift size={20} />,
    role: "all",
    group: "management",
  },
  {
    id: "reports",
    label: "گزارش‌ها",
    icon: <FileText size={20} />,
    role: "all",
    group: "analytics",
  },
  {
    id: "waste",
    label: "مدیریت ضایعات",
    icon: <Trash2 size={20} />,
    role: "all",
    group: "analytics",
  },
  {
    id: "stats",
    label: "آمار",
    icon: <History size={20} />,
    role: "super_admin",
    group: "analytics",
  },
  {
    id: "inventory",
    label: "موجودی",
    icon: <Coffee size={20} />,
    role: "super_admin",
    group: "management",
  },
  {
    id: "branches",
    label: "شعب",
    icon: <Building2 size={20} />,
    role: "super_admin",
    group: "management",
  },
  {
    id: "staff",
    label: "مدیریت کارکنان",
    icon: <Users size={20} />,
    role: "super_admin",
    group: "management",
  },
  {
    id: "settings",
    label: "تنظیمات سایت",
    icon: <Settings size={20} />,
    role: "super_admin",
    group: "settings",
  },
  {
    id: "banners",
    label: "بنرها",
    icon: <Image size={20} />,
    role: "super_admin",
    group: "content",
  },
  {
    id: "working-hours",
    label: "ساعات کاری",
    icon: <Clock size={20} />,
    role: "super_admin",
    group: "settings",
  },
];

const groupLabels: Record<string, string> = {
  main: "اصلی",
  management: "مدیریت",
  content: "محتوایی",
  analytics: "تحلیل و گزارش",
  settings: "تنظیمات",
};

export default function DashboardSidebar({
  isDark,
  userRole,
  isCollapsed,
  onToggleCollapse,
  pendingOrdersCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get current page from URL search params, default to "dashboard"
  const currentPage = searchParams.get("page") || "dashboard";
  const activePage = currentPage as DashboardPage;
  const filteredItems = navItems.filter((item) => {
    if (!userRole) return false;
    if (item.role === "all") return true;
    return item.role === userRole;
  });

  // Group items by group
  const groupedItems = filteredItems.reduce((acc, item) => {
    const group = item.group || "other";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const renderNavItem = (item: NavItem) => {
    const isActive = activePage === item.id;
    const badge = item.id === "orders" ? pendingOrdersCount : item.badge;
    const href = item.id === "dashboard" ? "/dashboard" : `/dashboard?page=${item.id}`;

    return (
      <Link
        key={item.id}
        href={href}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-right",
          "hover:bg-opacity-80",
          isActive
            ? isDark
              ? "bg-coffee-600 text-white shadow-lg"
              : "bg-coffee-600 text-white shadow-lg"
            : isDark
            ? "text-gray-300 hover:bg-neutral-800"
            : "text-gray-700 hover:bg-gray-100"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <span className={cn("flex-shrink-0", isActive && "text-white")}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : isDark
                    ? "bg-coffee-600 text-white"
                    : "bg-coffee-600 text-white"
                )}
              >
                {toPersianDigits(badge.toString())}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 border-l",
        isCollapsed ? "w-20" : "w-64",
        isDark
          ? "bg-neutral-900 border-white/10"
          : "bg-white border-gray-200 shadow-lg"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b",
          isDark ? "border-white/10" : "border-gray-200"
        )}
      >
        {!isCollapsed && (
          <h2
            className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            پنل مدیریت
          </h2>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDark
              ? "hover:bg-neutral-800 text-gray-400 hover:text-white"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          )}
          title={isCollapsed ? "باز کردن منو" : "بستن منو"}
        >
          {isCollapsed ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {Object.entries(groupedItems).map(([groupKey, items]) => (
          <div key={groupKey} className="mb-6 last:mb-0">
            {!isCollapsed && groupLabels[groupKey] && (
              <div
                className={cn(
                  "px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-2",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}
              >
                {groupLabels[groupKey]}
              </div>
            )}
            <div className="space-y-1">
              {items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

