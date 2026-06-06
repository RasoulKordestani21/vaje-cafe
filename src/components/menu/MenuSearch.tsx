"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isDark?: boolean;
  placeholder?: string;
}

const MenuSearch: React.FC<MenuSearchProps> = ({
  searchValue,
  onSearchChange,
  isDark = true,
  placeholder = "جستجوی محصولات..."
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-all duration-200",
          isFocused
            ? isDark
              ? "border-coffee-500 shadow-lg shadow-coffee-500/20"
              : "border-coffee-600 shadow-lg shadow-coffee-600/20"
            : isDark
            ? "border-white/10 bg-neutral-900/50"
            : "border-gray-300 bg-white",
          isDark ? "text-white" : "text-gray-900"
        )}
      >
        <Search
          size={20}
          className={cn(
            "absolute right-4 transition-colors",
            isDark ? "text-gray-400" : "text-gray-500"
          )}
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pr-12 pl-4 py-4 rounded-xl outline-none transition-colors",
            isDark
              ? "bg-transparent text-white placeholder:text-gray-500"
              : "bg-transparent text-gray-900 placeholder:text-gray-400"
          )}
          dir="rtl"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className={cn(
              "absolute left-4 p-1 rounded-full transition-colors",
              isDark
                ? "text-gray-400 hover:text-white hover:bg-white/10"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
            aria-label="پاک کردن جستجو"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {searchValue && (
        <div
          className={cn(
            "mt-2 text-sm text-center",
            isDark ? "text-gray-400" : "text-gray-600"
          )}
        >
          در حال جستجوی: <span className="font-semibold">{searchValue}</span>
        </div>
      )}
    </div>
  );
};

export default MenuSearch;



