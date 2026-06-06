"use client";

import React from "react";
import Link from "next/link";
import { LogOut, Moon, Sun, LayoutDashboard, Clock, Coffee, Users, Building2, ShoppingCart, ChefHat } from "lucide-react";
import BranchSelector from "@/components/BranchSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

interface DashboardHeaderProps {
  title: string;
  selectedBranchId: string | null;
  onBranchChange: (branchId: string | null) => void;
  isDark: boolean;
  onLogout: () => void;
  onToggleTheme: () => void;
  pendingOrdersCount: number;
  userRole: "admin" | "super_admin" | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  selectedBranchId,
  onBranchChange,
  isDark,
  onLogout,
  onToggleTheme,
  pendingOrdersCount,
  userRole
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <h1 className={cn("font-serif text-3xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          {title}
        </h1>
        <BranchSelector
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
          isDark={isDark}
        />
      </div>
      <div className="flex gap-2">
        <Link href="/pos">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10",
              isDark
                ? "bg-coffee-900/50 hover:bg-coffee-800 text-coffee-100"
                : "bg-coffee-100 hover:bg-coffee-200 text-coffee-700"
            )}
            title="سیستم فروش (POS)"
          >
            <ShoppingCart size={18} />
          </Button>
        </Link>
        <Link href="/kitchen">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10",
              isDark
                ? "bg-green-900/50 hover:bg-green-800 text-green-100"
                : "bg-green-100 hover:bg-green-200 text-green-700"
            )}
            title="نمایش آشپزخانه (KDS)"
          >
            <ChefHat size={18} />
          </Button>
        </Link>
        <Button
          onClick={onLogout}
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10",
            isDark
              ? "bg-red-900/50 hover:bg-red-900 text-red-100"
              : "bg-red-100 hover:bg-red-200 text-red-700"
          )}
          title="خروج"
        >
          <LogOut size={18} />
        </Button>
        <Button
          onClick={onToggleTheme}
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10",
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          )}
          title={isDark ? "تبدیل به روشن" : "تبدیل به تاریک"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;


