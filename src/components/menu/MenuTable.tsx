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
  MoreVertical,
  LayoutGrid,
  List
} from "lucide-react";
import { MenuItem } from "@/types";
import { decodeMenuCategory } from "@/constants/menuCategories";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-sm font-bold", adminTextPrimary(isDark))}>
            آیتم‌های منو ({toPersianDigits(items.length.toString())})
          </CardTitle>
          <div className={cn("flex items-center rounded-lg p-0.5 gap-0.5", isDark ? "bg-white/5" : "bg-gray-100")}>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? isDark ? "bg-white/10 text-white" : "bg-white text-gray-800 shadow-sm"
                  : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
              )}
              title="نمایش کارتی"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "table"
                  ? isDark ? "bg-white/10 text-white" : "bg-white text-gray-800 shadow-sm"
                  : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
              )}
              title="نمایش جدولی"
            >
              <List size={15} />
            </button>
          </div>
        </div>
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
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-vazir">
              <thead>
                <tr className={cn("border-b text-xs", isDark ? "border-white/[0.06] text-gray-400" : "border-gray-200 text-gray-500")}>
                  <th className="py-2 px-3 text-right font-medium">تصویر</th>
                  <th className="py-2 px-3 text-right font-medium">نام</th>
                  <th className="py-2 px-3 text-right font-medium">دسته‌بندی</th>
                  <th className="py-2 px-3 text-right font-medium">قیمت</th>
                  <th className="py-2 px-3 text-right font-medium">وضعیت</th>
                  <th className="py-2 px-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    draggable={!!onReorder}
                    onDragStart={e => handleDragStart(e, item.id)}
                    onDragOver={e => handleDragOver(e, item.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, item.id)}
                    className={cn(
                      "border-b transition-colors",
                      isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50",
                      draggedItem === item.id && "opacity-50",
                      draggedOverItem === item.id && (isDark ? "bg-coffee-500/10" : "bg-coffee-50")
                    )}
                  >
                    {/* Image */}
                    <td className="py-2 px-3">
                      <img
                        src={item.imageUrl || `https://picsum.photos/80/60?random=${item.id}`}
                        alt={item.name}
                        className="w-12 h-9 object-cover rounded-lg"
                      />
                    </td>
                    {/* Name */}
                    <td className="py-2 px-3">
                      <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{item.name}</span>
                      {item.description && (
                        <p className={cn("text-xs mt-0.5 line-clamp-1 max-w-[180px]", isDark ? "text-gray-500" : "text-gray-400")}>
                          {item.description}
                        </p>
                      )}
                    </td>
                    {/* Category */}
                    <td className="py-2 px-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-md", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600")}>
                        {(() => {
                          const decoded = decodeMenuCategory(item.category);
                          return decoded
                            ? `${decoded.categoryGroup} › ${decoded.category}`
                            : item.category;
                        })()}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="py-2 px-3">
                      <span className={cn("font-medium text-xs whitespace-nowrap", isDark ? "text-emerald-400" : "text-emerald-600")}>
                        {formatToman(item.price)}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {!item.available && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">ناموجود</span>
                        )}
                        {item.available && item.inStockFromInventory === false && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">عدم موجودی</span>
                        )}
                        {item.available && item.inStockFromInventory !== false && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">موجود</span>
                        )}
                        {item.is_pinned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500 flex items-center gap-0.5">
                            <Pin size={8} />ثابت
                          </span>
                        )}
                        {item.is_suggested && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 flex items-center gap-0.5">
                            <Star size={8} />پیشنهاد
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}
                          className={cn("h-7 w-7", isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500")}>
                          <Edit2 size={13} />
                        </Button>
                        {onTogglePin && (
                          <Button variant="ghost" size="icon" onClick={() => onTogglePin(item.id, !item.is_pinned)}
                            className={cn("h-7 w-7", item.is_pinned ? "text-yellow-500" : isDark ? "text-gray-500 hover:text-yellow-400" : "text-gray-400 hover:text-yellow-500")}>
                            <Pin size={13} />
                          </Button>
                        )}
                        {onToggleSuggest && (
                          <Button variant="ghost" size="icon" onClick={() => onToggleSuggest(item.id, !item.is_suggested)}
                            className={cn("h-7 w-7", item.is_suggested ? "text-blue-400" : isDark ? "text-gray-500 hover:text-blue-400" : "text-gray-400 hover:text-blue-500")}>
                            <Star size={13} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onManageIngredients(item.id)}
                          className={cn("h-7 w-7", isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700")}>
                          <Plus size={13} />
                        </Button>
                        {onReorder && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveUp(index)} disabled={index === 0}
                              className="h-7 w-7 text-gray-500 disabled:opacity-20">
                              <ArrowUp size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveDown(index)} disabled={index === items.length - 1}
                              className="h-7 w-7 text-gray-500 disabled:opacity-20">
                              <ArrowDown size={13} />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}
                          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  {item.available && item.inStockFromInventory === false && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                      عدم موجودی
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
