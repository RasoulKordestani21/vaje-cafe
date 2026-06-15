"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LogOut,
  Moon,
  Sun,
  ShoppingCart,
  ChefHat,
  Bell,
  Search,
  ChevronLeft,
  Menu,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  adminDropdown,
  adminIconBtn,
  adminInput,
  adminTextMuted,
  adminTextPrimary
} from "@/lib/adminTheme";
import { DashboardPage } from "@/components/dashboard/DashboardSidebar";
import {
  ADMIN_PAGE_META,
  ADMIN_ROLE_LABELS,
  searchAdminPages
} from "@/lib/adminPageMeta";
import { toPersianDigits } from "@/utils/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface DashboardHeaderProps {
  isDark: boolean;
  activePage: DashboardPage;
  onLogout: () => void;
  onToggleTheme: () => void;
  pendingOrdersCount?: number;
  userName?: string;
  userRole?: string | null;
  onNavigate: (page: DashboardPage) => void;
  onGlobalSearch?: (query: string) => void;
  quickActions?: QuickAction[];
  onMenuToggle?: () => void;
}

const iconBtn = (isDark: boolean) =>
  cn(
    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
    adminIconBtn(isDark)
  );

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDark,
  activePage,
  onLogout,
  onToggleTheme,
  pendingOrdersCount = 0,
  userName = "مدیر سیستم",
  userRole,
  onNavigate,
  onGlobalSearch,
  quickActions = [],
  onMenuToggle
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const pageMeta = ADMIN_PAGE_META[activePage] ?? ADMIN_PAGE_META.dashboard;
  const roleLabel = userRole ? ADMIN_ROLE_LABELS[userRole] ?? userRole : "کاربر";
  const searchResults = searchAdminPages(searchQuery);
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      onNavigate(searchResults[0]);
      setSearchOpen(false);
      setMobileSearchOpen(false);
      setSearchQuery("");
    } else if (searchQuery.trim() && onGlobalSearch) {
      onGlobalSearch(searchQuery.trim());
      setSearchOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const searchInputClass = cn(
    "w-full h-9 pr-9 pl-3 rounded-xl text-sm border outline-none transition-colors",
    adminInput(isDark)
  );

  const renderSearchDropdown = () =>
    searchOpen && searchQuery.trim() ? (
      <div
        className={cn(
          "absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border shadow-xl overflow-hidden max-h-56 overflow-y-auto",
          isDark ? "bg-[#1a1d24] border-white/10" : "bg-admin-surface border-admin-border shadow-lg"
        )}
      >
        {searchResults.length > 0 ? (
          searchResults.map(pageId => (
            <button
              key={pageId}
              type="button"
              onClick={() => {
                onNavigate(pageId);
                setSearchQuery("");
                setSearchOpen(false);
                setMobileSearchOpen(false);
              }}
              className={cn(
                "w-full text-right px-4 py-2.5 text-sm transition-colors",
                isDark
                  ? "hover:bg-white/5 text-gray-200"
                  : "hover:bg-admin-muted text-admin-primary"
              )}
            >
              {ADMIN_PAGE_META[pageId].title}
            </button>
          ))
        ) : (
          <p
            className={cn(
              "px-4 py-3 text-sm",
              isDark ? "text-gray-500" : "text-admin-muted-text"
            )}
          >
            نتیجه‌ای یافت نشد
          </p>
        )}
      </div>
    ) : null;

  const UserAvatar = ({ size = "md" }: { size?: "sm" | "md" }) => (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0",
        size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm",
        isDark ? "bg-coffee-600/30 text-coffee-300" : "bg-coffee-100 text-coffee-700"
      )}
    >
      {initials || "م"}
    </div>
  );

  return (
    <div className="relative w-full">
      {/* Main header row */}
      <div className="flex items-center gap-2 md:gap-3 w-full min-w-0">
        {/* Sidebar toggle — tablet & mobile */}
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className={cn(iconBtn(isDark), "lg:hidden")}
            aria-label="باز کردن منو"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Page context — title always; breadcrumb desktop only */}
        <div className="flex-1 min-w-0">
          {/* Full breadcrumb — large screens only */}
          <nav
            className={cn(
              "hidden xl:flex items-center gap-1 text-[11px] mb-0.5 truncate",
              adminTextMuted(isDark)
            )}
            aria-label="مسیر"
          >
            <span className="shrink-0">پنل مدیریت</span>
            <ChevronLeft size={11} className="opacity-50 shrink-0" />
            <span className="shrink-0">{pageMeta.group}</span>
            <ChevronLeft size={11} className="opacity-50 shrink-0" />
            <span className={cn("truncate", isDark ? "text-gray-400" : "text-gray-500")}>
              {pageMeta.breadcrumb}
            </span>
          </nav>

          {/* Compact group label — tablet only */}
          <p
            className={cn(
              "hidden md:block xl:hidden text-[10px] truncate mb-0.5",
              isDark ? "text-gray-500" : "text-admin-muted-text"
            )}
          >
            {pageMeta.group}
          </p>

          <h1
            className={cn(
              "font-bold truncate leading-tight text-sm md:text-base",
              adminTextPrimary(isDark)
            )}
          >
            {pageMeta.title}
          </h1>
        </div>

        {/* Desktop / tablet search */}
        <div
          ref={searchRef}
          className="relative hidden md:block shrink-0 w-40 lg:w-52 xl:w-64"
        >
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search
                size={15}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                  isDark ? "text-gray-500" : "text-admin-muted-text"
                )}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="جستجو..."
                className={searchInputClass}
              />
            </div>
          </form>
          {renderSearchDropdown()}
        </div>

        {/* Mobile search toggle */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(v => !v)}
          className={cn(iconBtn(isDark), "md:hidden")}
          aria-label="جستجو"
          aria-expanded={mobileSearchOpen}
        >
          {mobileSearchOpen ? <X size={17} /> : <Search size={17} />}
        </button>

        {/* Quick actions — tablet+ */}
        {quickActions.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {quickActions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={cn(
                  "h-9 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0",
                  action.variant === "primary"
                    ? "bg-coffee-600 hover:bg-coffee-500 text-white px-3"
                    : cn(
                        "px-2.5",
                        isDark
                          ? "bg-white/8 hover:bg-white/14 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      )
                )}
              >
                {action.icon ?? <Plus size={15} />}
                <span className="hidden lg:inline">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          {/* POS & Kitchen — desktop only (in menu on smaller screens) */}
          <Link href="/pos" title="سیستم فروش" className="hidden xl:block">
            <button type="button" className={iconBtn(isDark)}>
              <ShoppingCart size={16} />
            </button>
          </Link>
          <Link href="/kitchen" title="نمایش آشپزخانه" className="hidden xl:block">
            <button type="button" className={iconBtn(isDark)}>
              <ChefHat size={16} />
            </button>
          </Link>

          <button
            type="button"
            onClick={() => onNavigate("orders")}
            className={cn(iconBtn(isDark), "relative")}
            title="اعلان سفارشات"
          >
            <Bell size={16} />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {toPersianDigits(
                  pendingOrdersCount > 99 ? "99+" : pendingOrdersCount.toString()
                )}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={iconBtn(isDark)}
            title={isDark ? "حالت روشن" : "حالت تاریک"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Profile — desktop: inline with name */}
          <div
            className={cn(
              "hidden xl:flex items-center gap-2 mr-0.5 pl-2 border-r",
              isDark ? "border-white/10" : "border-admin-border"
            )}
          >
            <UserAvatar />
            <div className="min-w-0 max-w-[120px]">
              <p
                className={cn(
                  "text-sm font-semibold truncate leading-tight",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {userName}
              </p>
              <p
                className={cn(
                  "text-[11px] truncate",
                  isDark ? "text-gray-500" : "text-admin-muted-text"
                )}
              >
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Profile — mobile & tablet: avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(iconBtn(isDark), "xl:hidden p-0 overflow-hidden")}
                aria-label="حساب کاربری"
              >
                <UserAvatar size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className={cn(
                "w-56 z-[60]",
                adminDropdown(isDark)
              )}
            >
              <DropdownMenuLabel className="font-normal">
                <p className="font-semibold truncate">{userName}</p>
                <p
                  className={cn(
                    "text-xs font-normal mt-0.5",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}
                >
                  {roleLabel}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator
                className={isDark ? "bg-white/10" : undefined}
              />
              <DropdownMenuItem asChild className="xl:hidden cursor-pointer">
                <Link href="/pos" className="flex items-center gap-2">
                  <ShoppingCart size={15} />
                  سیستم فروش (POS)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="xl:hidden cursor-pointer">
                <Link href="/kitchen" className="flex items-center gap-2">
                  <ChefHat size={15} />
                  نمایش آشپزخانه
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator
                className={cn("xl:hidden", isDark ? "bg-white/10" : undefined)}
              />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-500 focus:text-red-500 cursor-pointer"
              >
                <LogOut size={15} className="ml-2" />
                خروج از حساب
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout — desktop only (mobile/tablet via dropdown) */}
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "hidden xl:flex",
              iconBtn(isDark),
              isDark
                ? "bg-red-500/15 hover:bg-red-500/25 text-red-400"
                : "bg-red-50 hover:bg-red-100 text-red-500"
            )}
            title="خروج"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile search panel — slides below header row */}
      {mobileSearchOpen && (
        <div
          className={cn(
            "md:hidden absolute top-full left-0 right-0 z-50 p-3 border-b shadow-lg",
            isDark
              ? "bg-[#111318] border-white/10"
              : "bg-admin-surface border-admin-border shadow-lg"
          )}
        >
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search
                size={15}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                  isDark ? "text-gray-500" : "text-admin-muted-text"
                )}
              />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="جستجو در پنل..."
                className={searchInputClass}
              />
            </div>
          </form>
          {searchQuery.trim() && (
            <div
              className={cn(
                "mt-2 rounded-xl border overflow-hidden max-h-48 overflow-y-auto",
                isDark ? "border-white/10" : "border-admin-border"
              )}
            >
              {searchResults.length > 0 ? (
                searchResults.map(pageId => (
                  <button
                    key={pageId}
                    type="button"
                    onClick={() => {
                      onNavigate(pageId);
                      setSearchQuery("");
                      setSearchOpen(false);
                      setMobileSearchOpen(false);
                    }}
                    className={cn(
                      "w-full text-right px-4 py-2.5 text-sm",
                      isDark
                        ? "hover:bg-white/5 text-gray-200"
                        : "hover:bg-admin-muted text-admin-primary"
                    )}
                  >
                    {ADMIN_PAGE_META[pageId].title}
                  </button>
                ))
              ) : (
                <p
                  className={cn(
                    "px-4 py-3 text-sm",
                    isDark ? "text-gray-500" : "text-admin-muted-text"
                  )}
                >
                  نتیجه‌ای یافت نشد
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
