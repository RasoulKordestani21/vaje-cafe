import { cn } from "@/lib/utils";

/**
 * Admin panel theme helpers.
 * Light mode uses a slate canvas + white elevated surfaces (not flat white-on-gray-50).
 */

export const adminShellBg = (isDark: boolean) =>
  cn(isDark ? "bg-[#0d0f13]" : "bg-admin-canvas");

export const adminContentBg = (isDark: boolean) =>
  cn(isDark ? "bg-[#0d0f13]" : "bg-admin-canvas");

export const adminHeaderBg = (isDark: boolean) =>
  cn(
    isDark
      ? "bg-[#111318] border-white/5"
      : "bg-admin-surface border-admin-border shadow-admin-header"
  );

export const adminSidebarBg = (isDark: boolean) =>
  cn(
    isDark
      ? "bg-[#111318] border-white/5"
      : "bg-admin-sidebar border-admin-border"
  );

export const adminCard = (isDark: boolean) =>
  cn(
    isDark
      ? "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
      : "bg-admin-surface border-admin-border shadow-admin-card hover:shadow-admin-card-hover"
  );

export const adminTextPrimary = (isDark: boolean) =>
  cn(isDark ? "text-white" : "text-admin-primary");

export const adminTextSecondary = (isDark: boolean) =>
  cn(isDark ? "text-gray-400" : "text-admin-secondary");

export const adminTextMuted = (isDark: boolean) =>
  cn(isDark ? "text-gray-500" : "text-admin-muted-text");

export const adminInput = (isDark: boolean) =>
  cn(
    isDark
      ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-coffee-500/50"
      : "bg-admin-surface border-admin-border-strong text-admin-primary placeholder:text-admin-muted focus:border-coffee-500/60 focus:ring-2 focus:ring-coffee-500/15"
  );

export const adminIconBtn = (isDark: boolean) =>
  cn(
    "transition-colors",
    isDark
      ? "bg-white/8 hover:bg-white/14 text-gray-300 hover:text-white"
      : "bg-admin-muted border border-admin-border text-admin-secondary hover:bg-slate-200/80 hover:text-admin-primary"
  );

export const adminDropdown = (isDark: boolean) =>
  cn(
    isDark
      ? "bg-[#1a1d24] border-white/10 text-gray-100"
      : "bg-admin-surface border-admin-border shadow-lg"
  );

export const adminMutedSurface = (isDark: boolean) =>
  cn(isDark ? "bg-white/[0.03]" : "bg-admin-muted");

export const adminDivider = (isDark: boolean) =>
  cn(isDark ? "border-white/10" : "border-admin-border");

export const adminTableWrap = (isDark: boolean) =>
  cn(
    isDark
      ? "border-white/10 bg-neutral-900/50"
      : "border-admin-border bg-admin-surface shadow-admin-card"
  );

export const adminTableHead = (isDark: boolean) =>
  cn(
    isDark ? "border-white/10 bg-neutral-900" : "border-admin-border bg-admin-muted"
  );

export const adminTableRow = (isDark: boolean) =>
  cn(
    isDark ? "border-white/5 hover:bg-neutral-900" : "border-admin-border/70 hover:bg-admin-muted/60"
  );

/** RTL-friendly select styling for admin panels */
export const adminSelectTrigger = (isDark: boolean) =>
  cn(adminInput(isDark), "text-right [&>span]:text-right");

export const adminSelectContent = (isDark: boolean) =>
  cn(
    "text-right",
    isDark ? "bg-neutral-900 text-white" : "bg-admin-surface border-admin-border"
  );

export const adminSelectItem =
  "text-right pr-8 pl-2 [&>span:first-child]:left-auto [&>span:first-child]:right-2";
