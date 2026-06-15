"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Upload,
  ImageIcon,
  Pin,
  Star,
  CheckCircle2
} from "lucide-react";
import { MenuItem, CATEGORIES } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MenuItemFormProps {
  editingItem: MenuItem | null;
  onSubmit: (data: Omit<MenuItem, "id">, imageFile?: File) => Promise<void>;
  onCancel?: () => void;
  onManageIngredients?: () => void;
  isDark: boolean;
  isSubmitting?: boolean;
  compact?: boolean;
  hideTitle?: boolean;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
  onManageIngredients,
  isDark,
  isSubmitting = false,
  compact = false,
  hideTitle = false
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      setImagePreview(editingItem.imageUrl || null);
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "اسپرسو",
        available: true,
        imageUrl: "",
        is_pinned: false,
        is_suggested: false
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editingItem]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, imageFile || undefined);
    if (!editingItem) {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "اسپرسو",
        available: true,
        imageUrl: "",
        is_pinned: false,
        is_suggested: false
      });
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const inputClass = cn(
    isDark
      ? "bg-neutral-900/80 border-white/10 text-white placeholder:text-gray-500"
      : "bg-white border-gray-200 text-gray-900"
  );

  const toggleClass = (active: boolean, color: string) =>
    cn(
      "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm",
      active
        ? isDark
          ? `${color} border-current/30 bg-current/10`
          : `${color} border-current/20 bg-current/5`
        : isDark
          ? "border-white/10 text-gray-400 hover:border-white/20"
          : "border-gray-200 text-gray-500 hover:border-gray-300"
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header row in compact/modal mode */}
      {compact && !hideTitle && (
        <div className="flex items-center gap-2 pb-1">
          {editingItem ? (
            <>
              <Edit2 size={18} className="text-coffee-500" />
              <span className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>
                ویرایش آیتم
              </span>
            </>
          ) : (
            <>
              <Plus size={18} className="text-coffee-500" />
              <span className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>
                افزودن آیتم جدید
              </span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column: basic info */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">نام آیتم *</Label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثلاً: کاپوچینو"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">توضیحات *</Label>
            <Textarea
              required
              rows={3}
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="توضیح کوتاه درباره آیتم..."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">قیمت (تومان) *</Label>
              <Input
                required
                type="number"
                step="1000"
                min="0"
                value={formData.price}
                onChange={e =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">دسته‌بندی</Label>
              <Select
                value={formData.category}
                onValueChange={value =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={cn(isDark ? "bg-neutral-900 text-white" : "bg-white")}
                >
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right column: image + toggles */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">تصویر</Label>
            <div
              className={cn(
                "relative rounded-xl border-2 border-dashed overflow-hidden transition-colors",
                isDark
                  ? "border-white/15 hover:border-coffee-500/50 bg-neutral-900/50"
                  : "border-gray-200 hover:border-coffee-400 bg-gray-50"
              )}
            >
              {imagePreview ? (
                <div className="relative aspect-video">
                  <img
                    src={imagePreview}
                    alt="پیش‌نمایش"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-2 py-6">
                  <ImageIcon
                    size={28}
                    className={isDark ? "text-gray-600" : "text-gray-300"}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    {imageFile ? imageFile.name : "انتخاب تصویر از دستگاه"}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={formData.imageUrl || ""}
              onChange={e => {
                setFormData({ ...formData, imageUrl: e.target.value });
                if (e.target.value) setImagePreview(e.target.value);
              }}
              placeholder="یا لینک تصویر (اختیاری)"
              className={cn(inputClass, "mt-2 dir-ltr text-right text-xs")}
            />
          </div>

          <div className="space-y-2">
            <label className={toggleClass(formData.available, "text-emerald-400")}>
              <input
                type="checkbox"
                checked={formData.available}
                onChange={e =>
                  setFormData({ ...formData, available: e.target.checked })
                }
                className="sr-only"
              />
              <CheckCircle2 size={16} />
              موجود برای سفارش
            </label>
            <label className={toggleClass(!!formData.is_pinned, "text-yellow-400")}>
              <input
                type="checkbox"
                checked={formData.is_pinned || false}
                onChange={e =>
                  setFormData({ ...formData, is_pinned: e.target.checked })
                }
                className="sr-only"
              />
              <Pin size={16} />
              نمایش در بالای منو
            </label>
            <label className={toggleClass(!!formData.is_suggested, "text-blue-400")}>
              <input
                type="checkbox"
                checked={formData.is_suggested || false}
                onChange={e =>
                  setFormData({ ...formData, is_suggested: e.target.checked })
                }
                className="sr-only"
              />
              <Star size={16} />
              پیشنهاد امروز
            </label>
          </div>
        </div>
      </div>

      {editingItem && onManageIngredients && (
        <Button
          type="button"
          onClick={onManageIngredients}
          variant="outline"
          className={cn(
            "w-full",
            isDark ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : ""
          )}
        >
          <Plus size={16} className="ml-2" />
          مدیریت مواد اولیه
        </Button>
      )}

      <div className="flex gap-2 pt-1">
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
                ? "border-white/10 text-gray-300 hover:bg-white/5"
                : "border-gray-200"
            )}
          >
            انصراف
          </Button>
        )}
      </div>
    </form>
  );
};

export default MenuItemForm;
