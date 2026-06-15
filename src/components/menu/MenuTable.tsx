"use client";

import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Pin,
  Star,
  ArrowUp,
  ArrowDown,
  GripVertical,
  MoreVertical
} from "lucide-react";
import { MenuItem } from "@/types";
import { formatToman, toPersianDigits } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { adminCard, adminTextPrimary, adminTextMuted } from "@/lib/adminTheme";

interface MenuTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onManageIngredients: (itemId: string) => void;
  onTogglePin?: (itemId: string, isPinned: boolean) => void | Promise<void>;
  onToggleSuggest?: (itemId: string, isSuggested: boolean) => void | Promise<void>;
  onReorder?: (itemOrders: Array<{ id: string; display_order: number }>) => void | Promise<void>;
  isDark: boolean;
}

const MenuTable: React.FC<MenuTableProps> = ({
  items,
  onEdit,
  onDelete,
  onManageIngredients,
  onTogglePin,
  onToggleSuggest,
  onReorder,
  isDark
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedItem && draggedItem !== itemId) {
      setDraggedOverItem(itemId);
    }
  };

  const handleDragLeave = () => setDraggedOverItem(null);

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    setDraggedOverItem(null);
    if (!draggedItem || draggedItem === targetItemId || !onReorder) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    await onReorder(
      newItems.map((item, index) => ({ id: item.id, display_order: index + 1 }))
    );
    setDraggedItem(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !onReorder) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    await onReorder(newItems.map((item, idx) => ({ id: item.id, display_order: idx + 1 })));
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1 || !onReorder) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    await onReorder(newItems.map((item, idx) => ({ id: item.id, display_order: idx + 1 })));
  };

  return (
    <Card className={cn("overflow-hidden", adminCard(isDark))}>
      <CardHeader
        className={cn(
          "border-b py-4",
          isDark ? "border-white/[0.06]" : "border-admin-border"
        )}
      >
        <CardTitle className={cn("text-sm font-bold", adminTextPrimary(isDark))}>
          آیتم‌های منو ({toPersianDigits(items.length.toString())})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {items.length === 0 ? (
          <div
            className={cn(
              "p-12 text-center text-sm",
              isDark ? "text-gray-500" : "text-gray-400"
            )}
          >
            هنوز آیتمی به منو اضافه نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable={!!onReorder}
                onDragStart={e => handleDragStart(e, item.id)}
                onDragOver={e => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, item.id)}
                className={cn(
                  "group relative rounded-2xl border overflow-hidden transition-all",
                  isDark
                    ? "bg-white/[0.02] border-white/[0.06] hover:border-white/12"
                    : "bg-admin-surface border-admin-border shadow-admin-card hover:shadow-admin-card-hover hover:border-admin-border-strong",
                  draggedItem === item.id && "opacity-50",
                  draggedOverItem === item.id &&
                    (isDark
                      ? "ring-2 ring-coffee-500/50"
                      : "ring-2 ring-coffee-400/50")
                )}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={
                      item.imageUrl ||
                      `https://picsum.photos/400/300?random=${item.id}`
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 right-2 left-2 flex items-end justify-between">
                    <span className="text-white font-bold text-sm drop-shadow">
                      {formatToman(item.price)}
                    </span>
                    {onReorder && (
                      <GripVertical
                        size={16}
                        className="text-white/60 cursor-grab active:cursor-grabbing"
                      />
                    )}
                  </div>
                  {!item.available && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                      ناموجود
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5">
                  <h4
                    className={cn(
                      "font-bold text-sm mb-1 truncate",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    {item.name}
                  </h4>
                  <p
                    className={cn(
                      "text-xs line-clamp-2 mb-2.5 leading-5 min-h-[2.5rem]",
                      isDark ? "text-gray-500" : "text-gray-500"
                    )}
                  >
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                        isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.category}
                    </span>
                    {item.is_pinned && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-yellow-500/15 text-yellow-500 flex items-center gap-0.5">
                        <Pin size={9} />
                        ثابت
                      </span>
                    )}
                    {item.is_suggested && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 flex items-center gap-0.5">
                        <Star size={9} />
                        پیشنهاد
                      </span>
                    )}
                  </div>

                  {/* Actions — always visible on mobile, hover on desktop */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className={cn(
                        "flex-1 h-8 text-xs",
                        isDark
                          ? "bg-white/5 hover:bg-coffee-600/80 text-gray-300 hover:text-white"
                          : "bg-gray-50 hover:bg-coffee-600 hover:text-white text-gray-700"
                      )}
                    >
                      <Edit2 size={13} className="ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExpandedActions(
                          expandedActions === item.id ? null : item.id
                        )
                      }
                      className={cn(
                        "h-8 w-8 shrink-0",
                        isDark ? "bg-white/5 text-gray-400" : "bg-gray-50 text-gray-500"
                      )}
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>

                  {expandedActions === item.id && (
                    <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-1">
                      {onTogglePin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTogglePin(item.id, !item.is_pinned)}
                          className="h-7 text-[10px] justify-start"
                        >
                          <Pin size={11} className="ml-1" />
                          {item.is_pinned ? "حذف ثابت" : "ثابت کردن"}
                        </Button>
                      )}
                      {onToggleSuggest && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onToggleSuggest(item.id, !item.is_suggested)
                          }
                          className="h-7 text-[10px] justify-start"
                        >
                          <Star size={11} className="ml-1" />
                          پیشنهاد
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageIngredients(item.id)}
                        className="h-7 text-[10px] justify-start"
                      >
                        <Plus size={11} className="ml-1" />
                        مواد اولیه
                      </Button>
                      {onReorder && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="h-7 text-[10px] justify-start"
                          >
                            <ArrowUp size={11} className="ml-1" />
                            بالا
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === items.length - 1}
                            className="h-7 text-[10px] justify-start"
                          >
                            <ArrowDown size={11} className="ml-1" />
                            پایین
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="h-7 text-[10px] justify-start text-red-400 hover:text-red-300 col-span-2"
                      >
                        <Trash2 size={11} className="ml-1" />
                        حذف
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuTable;
