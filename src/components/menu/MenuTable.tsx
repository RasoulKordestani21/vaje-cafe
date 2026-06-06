"use client";

import React, { useState } from "react";
import { Edit2, Trash2, Plus, Pin, Star, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { MenuItem } from "@/types";
import { formatToman, toPersianDigits } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const handleDragLeave = () => {
    setDraggedOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    setDraggedOverItem(null);

    if (!draggedItem || draggedItem === targetItemId || !onReorder) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order array
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update display_order for all items
    const itemOrders = newItems.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));

    await onReorder(itemOrders);
    setDraggedItem(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !onReorder) return;

    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

    const itemOrders = newItems.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1
    }));

    await onReorder(itemOrders);
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1 || !onReorder) return;

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

    const itemOrders = newItems.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1
    }));

    await onReorder(itemOrders);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-lg",
        isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
      )}
    >
      <CardHeader className={cn("border-b", isDark ? "bg-neutral-900/50 border-white/5" : "bg-gray-50 border-gray-300")}>
        <CardTitle className={cn("text-lg", isDark ? "text-gray-300" : "text-gray-900")}>
          آیتم‌های منو ({toPersianDigits(items.length.toString())})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {items.length === 0 && (
            <div className={cn("p-12 text-center text-lg", isDark ? "text-gray-500" : "text-gray-400")}>
              هنوز آیتمی به منو اضافه نشده است.
            </div>
          )}
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              className={cn(
                "p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group cursor-move",
                isDark ? "hover:bg-white/5" : "hover:bg-gray-50",
                draggedItem === item.id && "opacity-50",
                draggedOverItem === item.id && (isDark ? "bg-coffee-900/30 border-t-2 border-coffee-500" : "bg-coffee-50 border-t-2 border-coffee-500")
              )}
            >
              {onReorder && (
                <div className="flex flex-col gap-1">
                  <GripVertical
                    size={20}
                    className={cn(
                      "cursor-grab active:cursor-grabbing",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={cn(
                      "h-6 w-6",
                      isDark
                        ? "text-gray-500 hover:text-white disabled:opacity-30"
                        : "text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    )}
                    title="جابجایی به بالا"
                  >
                    <ArrowUp size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    className={cn(
                      "h-6 w-6",
                      isDark
                        ? "text-gray-500 hover:text-white disabled:opacity-30"
                        : "text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    )}
                    title="جابجایی به پایین"
                  >
                    <ArrowDown size={12} />
                  </Button>
                </div>
              )}
              <img
                src={
                  item.imageUrl ||
                  `https://picsum.photos/100/100?random=${item.id}`
                }
                alt={item.name}
                className={cn(
                  "w-20 h-20 rounded-lg object-cover",
                  isDark ? "bg-neutral-800" : "bg-gray-100"
                )}
              />
              <div className="flex-grow">
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>
                    {item.name}
                  </h4>
                  <span className={cn("font-mono text-lg font-bold", isDark ? "text-coffee-400" : "text-coffee-600")}>
                    {formatToman(item.price)}
                  </span>
                </div>
                <p className={cn("text-sm line-clamp-1 mb-2 leading-6", isDark ? "text-gray-500" : "text-gray-600")}>
                  {item.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded border",
                      isDark
                        ? "bg-neutral-800 text-gray-300 border-white/5"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    )}
                  >
                    {item.category}
                  </span>
                  {item.is_pinned && (
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded border flex items-center gap-1",
                        isDark
                          ? "bg-yellow-900/30 text-yellow-400 border-yellow-900/50"
                          : "bg-yellow-50 text-yellow-700 border-yellow-300"
                      )}
                    >
                      <Pin size={12} />
                      ثابت شده
                    </span>
                  )}
                  {item.is_suggested && (
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded border flex items-center gap-1",
                        isDark
                          ? "bg-blue-900/30 text-blue-400 border-blue-900/50"
                          : "bg-blue-50 text-blue-700 border-blue-300"
                      )}
                    >
                      <Star size={12} />
                      پیشنهاد امروز
                    </span>
                  )}
                  {!item.available && (
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded border",
                        isDark
                          ? "bg-red-900/30 text-red-400 border-red-900/50"
                          : "bg-red-50 text-red-600 border-red-300"
                      )}
                    >
                      ناموجود
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(item)}
                  className={cn(
                    "h-9 w-9",
                    isDark
                      ? "bg-neutral-800 hover:bg-coffee-600 text-gray-400 hover:text-white"
                      : "bg-gray-100 hover:bg-coffee-600 text-gray-600 hover:text-white"
                  )}
                  title="ویرایش"
                >
                  <Edit2 size={16} />
                </Button>
                {onTogglePin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTogglePin(item.id, !item.is_pinned)}
                    className={cn(
                      "h-9 w-9",
                      item.is_pinned
                        ? isDark
                          ? "bg-yellow-900/30 hover:bg-yellow-800/50 text-yellow-400"
                          : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                        : isDark
                        ? "bg-neutral-800 hover:bg-yellow-900/30 text-gray-400 hover:text-yellow-400"
                        : "bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-700"
                    )}
                    title={item.is_pinned ? "حذف از بالای منو" : "ثابت کردن در بالای منو"}
                  >
                    <Pin size={16} fill={item.is_pinned ? "currentColor" : "none"} />
                  </Button>
                )}
                {onToggleSuggest && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleSuggest(item.id, !item.is_suggested)}
                    className={cn(
                      "h-9 w-9",
                      item.is_suggested
                        ? isDark
                          ? "bg-blue-900/30 hover:bg-blue-800/50 text-blue-400"
                          : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                        : isDark
                        ? "bg-neutral-800 hover:bg-blue-900/30 text-gray-400 hover:text-blue-400"
                        : "bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700"
                    )}
                    title={item.is_suggested ? "حذف از پیشنهادات" : "اضافه به پیشنهادات"}
                  >
                    <Star size={16} fill={item.is_suggested ? "currentColor" : "none"} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onManageIngredients(item.id)}
                  className={cn(
                    "h-9 w-9",
                    isDark
                      ? "bg-neutral-800 hover:bg-emerald-600 text-gray-400 hover:text-white"
                      : "bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white"
                  )}
                  title="مواد اولیه"
                >
                  <Plus size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  className={cn(
                    "h-9 w-9",
                    isDark
                      ? "bg-neutral-800 hover:bg-red-600 text-gray-400 hover:text-white"
                      : "bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white"
                  )}
                  title="حذف"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuTable;


