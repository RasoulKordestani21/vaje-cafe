"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPage } from "@/components/dashboard/DashboardSidebar";
import { ADMIN_PAGE_META } from "@/lib/adminPageMeta";
import { adminTextMuted, adminTextPrimary } from "@/lib/adminTheme";

interface AdminBreadcrumbProps {
  activePage: DashboardPage;
  isDark: boolean;
  className?: string;
  variant?: "header" | "inline";
}

export function AdminBreadcrumbNav({
  activePage,
  isDark,
  className,
  variant = "inline"
}: AdminBreadcrumbProps) {
  const pageMeta = ADMIN_PAGE_META[activePage] ?? ADMIN_PAGE_META.dashboard;

  if (variant === "header") {
    return (
      <nav
        className={cn("min-w-0 leading-tight shrink-0", className)}
        aria-label="مسیر"
      >
        <p
          className={cn(
            "text-[10px] md:text-[11px] truncate",
            isDark ? "text-gray-500" : "text-admin-muted-text"
          )}
        >
          {pageMeta.group}
        </p>
        <p
          className={cn(
            "text-xs md:text-sm font-semibold truncate",
            adminTextPrimary(isDark)
          )}
        >
          {pageMeta.breadcrumb}
        </p>
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "flex items-center gap-1 text-xs",
        adminTextMuted(isDark),
        className
      )}
      aria-label="مسیر"
    >
      <span className="shrink-0">پنل مدیریت</span>
      <ChevronLeft size={12} className="opacity-50 shrink-0" />
      <span className="shrink-0">{pageMeta.group}</span>
      <ChevronLeft size={12} className="opacity-50 shrink-0" />
      <span className={cn("truncate", isDark ? "text-gray-400" : "text-gray-500")}>
        {pageMeta.breadcrumb}
      </span>
    </nav>
  );
}

export function AdminPageTitle({
  activePage,
  isDark,
  className
}: AdminBreadcrumbProps) {
  const pageMeta = ADMIN_PAGE_META[activePage] ?? ADMIN_PAGE_META.dashboard;

  return (
    <h1
      className={cn(
        "text-xl md:text-2xl font-bold leading-tight mb-5",
        adminTextPrimary(isDark),
        className
      )}
    >
      {pageMeta.title}
    </h1>
  );
}

const AdminPageBreadcrumb: React.FC<AdminBreadcrumbProps> = props => (
  <div className="mb-1">
    <AdminBreadcrumbNav {...props} variant="inline" />
  </div>
);

export default AdminPageBreadcrumb;
