"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Upload } from "lucide-react";
import { MenuItem, CATEGORIES } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MenuItemFormProps {
  editingItem: MenuItem | null;
  onSubmit: (data: Omit<MenuItem, "id">, imageFile?: File) => Promise<void>;
  onCancel?: () => void;
  onManageIngredients?: () => void;
  isDark: boolean;
  isSubmitting?: boolean;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
  onManageIngredients,
  isDark,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Omit<MenuItem, "id">>({
    name: "",
    description: "",
    price: 0,
    category: "اسپرسو",
    available: true,
    imageUrl: "",
    is_pinned: false,
    is_suggested: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price,
        category: editingItem.category,
        available: editingItem.available,
        imageUrl: editingItem.imageUrl || "",
        is_pinned: editingItem.is_pinned || false,
        is_suggested: editingItem.is_suggested || false
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "اسپرسو",
        available: true,
        imageUrl: ""
      });
      setImageFile(null);
    }
  }, [editingItem]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, imageFile || undefined);
    if (!editingItem) {
      // Reset form after adding new item
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "اسپرسو",
        available: true,
        imageUrl: ""
      });
      setImageFile(null);
    }
  };

  return (
    <Card
      className={cn(
        "sticky top-28 shadow-lg",
        isDark ? "bg-neutral-900 border-white/5" : "bg-white border-gray-300"
      )}
    >
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
          {editingItem ? (
            <>
              <Edit2 size={20} className="text-coffee-500" />
              ویرایش آیتم
            </>
          ) : (
            <>
              <Plus size={20} className="text-coffee-500" />
              افزودن آیتم جدید
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className={cn("text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>
              نام آیتم
            </Label>
            <Input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                "w-full",
                isDark
                  ? "bg-neutral-950 border-neutral-800 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            />
          </div>

          <div>
            <Label className={cn("text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>
              توضیحات
            </Label>
            <Textarea
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className={cn(
                "w-full",
                isDark
                  ? "bg-neutral-950 border-neutral-800 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={cn("text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>
                قیمت (تومان)
              </Label>
              <Input
                required
                type="number"
                step="1000"
                value={formData.price}
                onChange={e =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0
                  })
                }
                className={cn(
                  "w-full",
                  isDark
                    ? "bg-neutral-950 border-neutral-800 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                )}
              />
            </div>
            <div>
              <Label className={cn("text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>
                دسته‌بندی
              </Label>
              <Select
                value={formData.category}
                onValueChange={value => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger
                  className={cn(
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(isDark ? "bg-neutral-900 text-white" : "bg-white text-gray-900")}>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className={cn("text-xs font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>
              تصویر
            </Label>
            <div className="space-y-2">
              <Input
                type="text"
                value={formData.imageUrl || ""}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="لینک تصویر (اختیاری)"
                className={cn(
                  "w-full dir-ltr text-right",
                  isDark
                    ? "bg-neutral-950 border-neutral-800 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                )}
              />
              <div className={cn("text-center text-xs", isDark ? "text-gray-500" : "text-gray-600")}>
                یا آپلود فایل
              </div>
              <div
                className={cn(
                  "relative border border-dashed rounded-lg p-4 text-center hover:border-coffee-500 transition-colors",
                  isDark
                    ? "border-gray-600 bg-neutral-950"
                    : "border-gray-400 bg-white"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={20} className={isDark ? "text-gray-400" : "text-gray-600"} />
                  <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                    {imageFile ? imageFile.name : "انتخاب تصویر از دستگاه"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded border",
                isDark
                  ? "bg-neutral-950 border-neutral-800"
                  : "bg-white border-gray-300"
              )}
            >
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={e => setFormData({ ...formData, available: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 text-coffee-600 focus:ring-coffee-500 bg-neutral-900"
              />
              <Label
                htmlFor="available"
                className={cn("text-sm cursor-pointer", isDark ? "text-gray-300" : "text-gray-700")}
              >
                موجود برای سفارش
              </Label>
            </div>

            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded border",
                isDark
                  ? "bg-neutral-950 border-neutral-800"
                  : "bg-white border-gray-300"
              )}
            >
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned || false}
                onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500 bg-neutral-900"
              />
              <Label
                htmlFor="is_pinned"
                className={cn("text-sm cursor-pointer", isDark ? "text-gray-300" : "text-gray-700")}
              >
                📌 در بالای منو نمایش داده شود
              </Label>
            </div>

            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded border",
                isDark
                  ? "bg-neutral-950 border-neutral-800"
                  : "bg-white border-gray-300"
              )}
            >
              <input
                type="checkbox"
                id="is_suggested"
                checked={formData.is_suggested || false}
                onChange={e => setFormData({ ...formData, is_suggested: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-neutral-900"
              />
              <Label
                htmlFor="is_suggested"
                className={cn("text-sm cursor-pointer", isDark ? "text-gray-300" : "text-gray-700")}
              >
                ⭐ به عنوان پیشنهاد امروز نمایش داده شود
              </Label>
            </div>
          </div>

          {editingItem && onManageIngredients && (
            <Button
              type="button"
              onClick={onManageIngredients}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus size={18} className="ml-2" />
              مدیریت مواد اولیه
            </Button>
          )}

          <div className="pt-4 flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-coffee-600 hover:bg-coffee-500 text-white"
            >
              {isSubmitting
                ? "در حال ذخیره..."
                : editingItem
                ? "بروزرسانی"
                : "افزودن به منو"}
            </Button>
            {editingItem && onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className={cn(
                  isDark
                    ? "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                    : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                )}
              >
                انصراف
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MenuItemForm;


