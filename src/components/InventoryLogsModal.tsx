"use client";

import React from "react";
import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { adminDivider, adminTextPrimary } from "@/lib/adminTheme";
import InventoryHistoryTabs from "@/components/inventory/InventoryHistoryTabs";
import type { InventoryLogRecord } from "@/lib/inventoryLogUtils";

interface InventoryLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: InventoryLogRecord[];
  productName: string;
  productUnit?: string;
  isDark: boolean;
}

export const InventoryLogsModal: React.FC<InventoryLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  productName,
  productUnit,
  isDark,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
          isDark ? "bg-neutral-900 border-white/10" : "bg-white"
        )}
        dir="rtl"
      >
        <DialogHeader className={cn("px-6 py-4 border-b shrink-0", adminDivider(isDark))}>
          <DialogTitle className={cn("flex items-center gap-2 text-lg font-bold", adminTextPrimary(isDark))}>
            <History size={18} className="text-coffee-500" />
            تاریخچه موجودی — {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-6">
          <InventoryHistoryTabs
            logs={logs}
            unit={productUnit}
            isDark={isDark}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
