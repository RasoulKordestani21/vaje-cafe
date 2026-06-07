"use client";

import React from "react";
import Link from "next/link";
import { LogOut, Moon, Sun, ShoppingCart, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  isDark: boolean;
  onLogout: () => void;
  onToggleTheme: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDark,
  onLogout,
  onToggleTheme
}) => {
  return (
    <div className="flex items-center justify-end gap-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <Link href="/pos">
          <button
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
              isDark
                ? "bg-white/8 hover:bg-white/14 text-gray-300 hover:text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            )}
            title="سیستم فروش (POS)"
          >
            <ShoppingCart size={16} />
          </button>
        </Link>
        <Link href="/kitchen">
          <button
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
              isDark
                ? "bg-white/8 hover:bg-white/14 text-gray-300 hover:text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
            )}
            title="نمایش آشپزخانه (KDS)"
          >
            <ChefHat size={16} />
          </button>
        </Link>

        {/* Divider */}
        <div
          className={cn(
            "w-px h-5 mx-0.5 rounded-full",
            isDark ? "bg-white/10" : "bg-gray-200"
          )}
        />

        <button
          onClick={onToggleTheme}
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
            isDark
              ? "bg-white/8 hover:bg-white/14 text-gray-300 hover:text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
          )}
          title={isDark ? "تبدیل به حالت روشن" : "تبدیل به حالت تاریک"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={onLogout}
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
            isDark
              ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300"
              : "bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600"
          )}
          title="خروج"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;


