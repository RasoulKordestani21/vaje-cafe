"use client";

import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  adminSelectContent,
  adminSelectItem,
  adminSelectTrigger,
  adminTextSecondary,
} from "@/lib/adminTheme";
import {
  INVENTORY_CATEGORY_TREE,
  getSubcategoriesForGroup,
} from "@/constants/inventoryCategories";

interface InventoryCategorySelectProps {
  categoryGroup: string;
  category: string;
  onCategoryGroupChange: (group: string) => void;
  onCategoryChange: (sub: string) => void;
  isDark: boolean;
  disabled?: boolean;
}

export function InventoryCategorySelect({
  categoryGroup,
  category,
  onCategoryGroupChange,
  onCategoryChange,
  isDark,
  disabled = false,
}: InventoryCategorySelectProps) {
  const subcategories = useMemo(
    () => (categoryGroup ? getSubcategoriesForGroup(categoryGroup) : []),
    [categoryGroup]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label className={cn("mb-1.5 block text-sm", adminTextSecondary(isDark))}>
          گروه دسته‌بندی *
        </Label>
        <Select
          value={categoryGroup || undefined}
          onValueChange={onCategoryGroupChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(adminSelectTrigger(isDark), "w-full")} dir="rtl">
            <SelectValue placeholder="انتخاب گروه" />
          </SelectTrigger>
          <SelectContent className={adminSelectContent(isDark)} dir="rtl">
            {INVENTORY_CATEGORY_TREE.map(item => (
              <SelectItem key={item.group} value={item.group} className={adminSelectItem}>
                {item.group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={cn("mb-1.5 block text-sm", adminTextSecondary(isDark))}>
          زیردسته *
        </Label>
        <Select
          key={categoryGroup || "no-group"}
          value={category || undefined}
          onValueChange={onCategoryChange}
          disabled={disabled || !categoryGroup}
        >
          <SelectTrigger className={cn(adminSelectTrigger(isDark), "w-full")} dir="rtl">
            <SelectValue
              placeholder={
                categoryGroup ? "انتخاب زیردسته" : "ابتدا گروه را انتخاب کنید"
              }
            />
          </SelectTrigger>
          <SelectContent className={adminSelectContent(isDark)} dir="rtl">
            {subcategories.map(sub => (
              <SelectItem key={sub} value={sub} className={adminSelectItem}>
                {sub}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default InventoryCategorySelect;
