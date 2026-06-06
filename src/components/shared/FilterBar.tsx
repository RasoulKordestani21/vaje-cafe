"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  onReset?: () => void;
  className?: string;
  isDark?: boolean;
}

export function FilterBar({
  searchPlaceholder = "جستجو...",
  searchValue,
  onSearchChange,
  filters = [],
  onReset,
  className,
  isDark = true,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4 rounded-lg border", className)}>
      {/* Search Bar */}
      {onSearchChange && (
        <div className="flex-1">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-end">
          {filters.map((filter) => (
            <div key={filter.key} className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 text-muted-foreground">
                {filter.label}
              </label>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-10"
            >
              <X className="h-4 w-4 ml-2" />
              بازنشانی
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

