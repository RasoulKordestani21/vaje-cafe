"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVisiblePageNumbers } from "@/utils/pagination";
import { toPersianDigits } from "@/utils/format";
import { adminIconBtn } from "@/lib/adminTheme";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDark?: boolean;
  siblingCount?: number;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isDark = true,
  siblingCount = 2,
  className
}) => {
  if (totalPages <= 1) return null;

  const pages = getVisiblePageNumbers(currentPage, totalPages, siblingCount);

  const btnBase = cn(
    "inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors",
    "disabled:opacity-40 disabled:cursor-not-allowed"
  );

  const navBtn = cn(btnBase, adminIconBtn(isDark));

  const pageBtn = (active: boolean) =>
    cn(
      btnBase,
      active
        ? "bg-coffee-600 text-white border border-coffee-600 shadow-sm"
        : adminIconBtn(isDark)
    );

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
      aria-label="صفحه‌بندی"
    >
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={navBtn}
        title="اولین صفحه"
        aria-label="اولین صفحه"
      >
        <ChevronsRight size={16} />
      </button>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={navBtn}
        title="صفحه قبل"
        aria-label="صفحه قبل"
      >
        <ChevronRight size={16} />
        <span className="hidden sm:inline mr-1">قبلی</span>
      </button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className={cn(
              "px-2 text-sm select-none",
              isDark ? "text-gray-500" : "text-gray-400"
            )}
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={pageBtn(page === currentPage)}
            aria-label={`صفحه ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {toPersianDigits(page.toString())}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={navBtn}
        title="صفحه بعد"
        aria-label="صفحه بعد"
      >
        <span className="hidden sm:inline ml-1">بعدی</span>
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={navBtn}
        title="آخرین صفحه"
        aria-label="آخرین صفحه"
      >
        <ChevronsLeft size={16} />
      </button>
    </nav>
  );
};

export default PaginationControls;
