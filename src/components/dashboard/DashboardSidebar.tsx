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
  ChevronLeft,
  ChevronRight
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
  isMobileOpen?: boolean;
  onMobileOpen?: () => void;
  onMobileClose?: () => void;
  pendingOrdersCount?: number;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "داشبورد",
    icon: <LayoutDashboard size={20} />,
    role: "all",
    group: "main"
  },
  {
    id: "orders",
    label: "سفارشات",
    icon: <Clock size={20} />,
    role: "all",
    group: "main"
  },
  {
    id: "menu",
    label: "مدیریت منو",
    icon: <Coffee size={20} />,
    role: "all",
    group: "main"
  },
  {
    id: "customer-orders",
    label: "سفارشات مشتری",
    icon: <Users size={20} />,
    role: "all",
    group: "main"
  },
  {
    id: "customers",
    label: "مشتریان",
    icon: <Users size={20} />,
    role: "super_admin",
    group: "management"
  },
  {
    id: "expenses",
    label: "هزینه‌ها",
    icon: <DollarSign size={20} />,
    role: "all",
    group: "management"
  },
  {
    id: "ratings",
    label: "نظرات و امتیازها",
    icon: <Star size={20} />,
    role: "all",
    group: "management"
  },
  {
    id: "customer-messages",
    label: "پیام‌های مشتریان",
    icon: <MessageSquareText size={20} />,
    role: "all",
    group: "management"
  },
  {
    id: "gallery",
    label: "گالری تصاویر",
    icon: <Images size={20} />,
    role: "all",
    group: "content"
  },
  {
    id: "stories",
    label: "استوری‌ها",
    icon: <BookOpen size={20} />,
    role: "all",
    group: "content"
  },
  {
    id: "experience-comments",
    label: "نظرات تجربه",
    icon: <MessageSquareText size={20} />,
    role: "all",
    group: "content"
  },
  {
    id: "loyalty",
    label: "برنامه وفاداری",
    icon: <Gift size={20} />,
    role: "all",
    group: "management"
  },
  {
    id: "reports",
    label: "گزارش‌ها",
    icon: <FileText size={20} />,
    role: "all",
    group: "analytics"
  },
  {
    id: "waste",
    label: "مدیریت ضایعات",
    icon: <Trash2 size={20} />,
    role: "all",
    group: "analytics"
  },
  {
    id: "stats",
    label: "آمار",
    icon: <History size={20} />,
    role: "super_admin",
    group: "analytics"
  },
  {
    id: "inventory",
    label: "موجودی",
    icon: <Coffee size={20} />,
    role: "super_admin",
    group: "management"
  },
  {
    id: "branches",
    label: "شعب",
    icon: <Building2 size={20} />,
    role: "super_admin",
    group: "management"
  },
  {
    id: "staff",
    label: "مدیریت کارکنان",
    icon: <Users size={20} />,
    role: "super_admin",
    group: "management"
  },
  {
    id: "settings",
    label: "تنظیمات سایت",
    icon: <Settings size={20} />,
    role: "super_admin",
    group: "settings"
  },
  {
    id: "banners",
    label: "بنرها",
    icon: <Image size={20} />,
    role: "super_admin",
    group: "content"
  },
  {
    id: "working-hours",
    label: "ساعات کاری",
    icon: <Clock size={20} />,
    role: "super_admin",
    group: "settings"
  }
];

const SIDEBAR_TAB_GUIDE_KEY = "vaje_sidebar_tab_guide_seen";
const MOBILE_RAIL_WIDTH = 80;
const MOBILE_OVERLAY_WIDTH = 256;

const groupLabels: Record<string, string> = {
  main: "اصلی",
  management: "مدیریت",
  content: "محتوایی",
  analytics: "تحلیل و گزارش",
  settings: "تنظیمات"
};

export default function DashboardSidebar({
  isDark,
  userRole,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileOpen,
  onMobileClose,
  pendingOrdersCount = 0
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // JS-based mobile detection — avoids broken CSS-variable breakpoints
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile overlay when switching between mobile/desktop
  React.useEffect(() => {
    if (!isMobileOpen) return;
    if (!isMobile) onMobileClose?.();
  }, [isMobile, isMobileOpen, onMobileClose]);

  // First-time guide for the mobile expand chevron
  const [showTabGuide, setShowTabGuide] = React.useState(false);
  React.useEffect(() => {
    if (!isMobile || isMobileOpen) {
      setShowTabGuide(false);
      return;
    }
    const seen = localStorage.getItem(SIDEBAR_TAB_GUIDE_KEY);
    if (!seen) {
      const timer = window.setTimeout(() => setShowTabGuide(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, [isMobile, isMobileOpen]);

  const dismissTabGuide = React.useCallback(() => {
    setShowTabGuide(false);
    localStorage.setItem(SIDEBAR_TAB_GUIDE_KEY, "1");
  }, []);

  const handleMobileExpand = React.useCallback(() => {
    dismissTabGuide();
    onMobileOpen?.();
  }, [dismissTabGuide, onMobileOpen]);

  // Resizable sidebar width (desktop only)
  const [localWidth, setLocalWidth] = React.useState(256);
  const [isResizing, setIsResizing] = React.useState(false);
  const dragRef = React.useRef({ startX: 0, startWidth: 256 });

  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startWidth: localWidth };
      setIsResizing(true);

      const onMove = (ev: MouseEvent) => {
        // Sidebar is on the RIGHT in RTL; moving mouse LEFT increases width
        const delta = dragRef.current.startX - ev.clientX;
        const next = Math.min(420, Math.max(180, dragRef.current.startWidth + delta));
        setLocalWidth(next);
      };
      const onUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [localWidth]
  );

  React.useEffect(() => {
    onMobileClose?.();
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (!isMobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileOpen]);

  // Get current page from URL search params, default to "dashboard"
  const currentPage = searchParams.get("page") || "dashboard";
  const activePage = currentPage as DashboardPage;
  const filteredItems = navItems.filter(item => {
    if (!userRole) return false;
    if (item.role === "all") return true;
    return item.role === userRole;
  });

  // Group items by group
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      const group = item.group || "other";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  const renderNavItem = (item: NavItem, expanded: boolean, closeOverlayOnClick = false) => {
    const isActive = activePage === item.id;
    const badge = item.id === "orders" ? pendingOrdersCount : item.badge;
    const href =
      item.id === "dashboard" ? "/dashboard" : `/dashboard?page=${item.id}`;

    return (
      <Link
        key={item.id}
        href={href}
        onClick={() => {
          if (closeOverlayOnClick) onMobileClose?.();
        }}
        className={cn(
          "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-right",
          // right border accent (RTL sidebar wall side) — always present to avoid layout shift
          "border-r-2",
          isActive
            ? isDark
              ? "bg-white/10 text-white border-coffee-400"
              : "bg-coffee-600/10 text-coffee-700 border-coffee-600"
            : isDark
              ? "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 border-transparent"
        )}
        title={!expanded ? item.label : undefined}
      >
        <span
          className={cn(
            "flex-shrink-0 transition-colors duration-150",
            isActive
              ? isDark
                ? "text-coffee-400"
                : "text-coffee-600"
              : isDark
                ? "text-gray-500 group-hover:text-gray-300"
                : "text-gray-400"
          )}
        >
          {item.icon}
        </span>
        {expanded && (
          <>
            <span className="flex-1 text-sm font-medium truncate">
              {item.label}
            </span>
            {badge !== undefined && Number(badge) > 0 && (
              <span
                className={cn(
                  "min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-semibold",
                  isActive
                    ? isDark
                      ? "bg-coffee-400/25 text-coffee-300"
                      : "bg-coffee-600/15 text-coffee-700"
                    : "bg-red-500 text-white"
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

  const desktopWidth = isCollapsed ? MOBILE_RAIL_WIDTH : localWidth;

  const panelClassName = cn(
    "bg-inherit",
    isDark ? "border-white/5" : "border-gray-200"
  );

  const renderSidebarPanel = (
    expanded: boolean,
    options: {
      onToggle: () => void;
      toggleTitle: string;
      toggleIcon: React.ReactNode;
      showResize?: boolean;
      closeOverlayOnNavClick?: boolean;
    }
  ) => (
    <>
      {options.showResize && (
        <div
          onMouseDown={handleResizeStart}
          className={cn(
            "absolute left-0 inset-y-0 w-1.5 z-10 cursor-col-resize group/resize",
            "flex items-center justify-center"
          )}
          title="بکشید تا اندازه تغییر کند"
        >
          <div
            className={cn(
              "w-0.5 h-12 rounded-full transition-colors duration-150",
              isResizing
                ? "bg-coffee-400"
                : isDark
                  ? "bg-white/0 group-hover/resize:bg-white/20"
                  : "bg-black/0 group-hover/resize:bg-black/15"
            )}
          />
        </div>
      )}

      <div
        className={cn(
          "relative flex items-center h-16 px-3 border-b shrink-0",
          expanded ? "justify-between" : "justify-center",
          panelClassName
        )}
      >
        {expanded && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-base font-bold bg-coffee-600">
              ک
            </div>
            <span
              className={cn(
                "text-sm font-semibold truncate",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              پنل مدیریت
            </span>
          </div>
        )}

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={options.onToggle}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDark
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            )}
            title={options.toggleTitle}
            aria-label={options.toggleTitle}
          >
            {options.toggleIcon}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {Object.entries(groupedItems).map(([groupKey, items]) => (
          <div key={groupKey}>
            {expanded && groupLabels[groupKey] && (
              <p
                className={cn(
                  "px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest",
                  isDark ? "text-gray-600" : "text-gray-400"
                )}
              >
                {groupLabels[groupKey]}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(item =>
                renderNavItem(item, expanded, options.closeOverlayOnNavClick)
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: arrow tab only (no icon rail) */}
      {isMobile && !isMobileOpen && (
        <div className="fixed top-1/2 -translate-y-1/2 start-0 z-30 flex items-center">
          {showTabGuide && (
            <div
              className={cn(
                "absolute end-full me-3 w-48 rounded-xl border p-3 shadow-xl animate-in fade-in slide-in-from-right-2 duration-300",
                isDark
                  ? "bg-neutral-800 border-white/10 text-gray-100"
                  : "bg-white border-gray-200 text-gray-800"
              )}
              role="status"
              aria-live="polite"
            >
              <p className="text-xs font-semibold leading-relaxed mb-1.5">
                منوی کناری
              </p>
              <p className="text-[11px] leading-relaxed opacity-80 mb-2.5">
                برای دیدن بخش‌های داشبورد، روی فلش بزنید.
              </p>
              <button
                type="button"
                onClick={dismissTabGuide}
                className="w-full rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-coffee-600 hover:bg-coffee-500 text-white transition-colors"
              >
                متوجه شدم
              </button>
              <span
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 start-full w-0 h-0",
                  "border-y-[6px] border-y-transparent border-s-[8px]",
                  isDark ? "border-s-neutral-800" : "border-s-white"
                )}
                aria-hidden
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleMobileExpand}
            className={cn(
              "h-14 w-8 rounded-e-xl flex items-center justify-center shadow-lg transition-all duration-200",
              "bg-coffee-600 text-white hover:bg-coffee-500 active:scale-95",
              showTabGuide && "ring-2 ring-coffee-400/60 ring-offset-2 animate-pulse",
              isDark ? "ring-offset-[#0d0f13]" : "ring-offset-gray-50"
            )}
            title="باز کردن منو"
            aria-label="باز کردن منو"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {/* Mobile backdrop — only when full overlay is open */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden={false}
        />
      )}

      {/* Mobile full overlay — opens on top of content */}
      {isMobile && isMobileOpen && (
        <div
          className={cn(
            "fixed inset-y-0 start-0 z-50 flex flex-col h-screen border-l shadow-2xl",
            isDark
              ? "bg-[#111318] border-white/5"
              : "bg-[#fafafa] border-gray-200"
          )}
          style={{ width: MOBILE_OVERLAY_WIDTH }}
        >
          {renderSidebarPanel(true, {
            onToggle: () => onMobileClose?.(),
            toggleTitle: "بستن منو",
            toggleIcon: <ChevronRight size={18} />,
            closeOverlayOnNavClick: true
          })}
        </div>
      )}

      {/* Desktop inline sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "relative flex flex-col h-screen border-l shrink-0 shadow-lg",
            isResizing ? "transition-none" : "transition-[width] duration-200",
            isDark
              ? "bg-[#111318] border-white/5"
              : "bg-[#fafafa] border-gray-200"
          )}
          style={{ width: desktopWidth }}
        >
          {renderSidebarPanel(!isCollapsed, {
            onToggle: () => onToggleCollapse(),
            toggleTitle: isCollapsed ? "باز کردن منو" : "بستن منو",
            toggleIcon: isCollapsed ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            ),
            showResize: !isCollapsed,
            closeOverlayOnNavClick: false
          })}
        </div>
      )}
    </>
  );
}
