"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  AlertCircle,
  Loader,
  TrendingUp,
  History,
  Package,
  PackagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/PriceInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { adminFetchInit } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatToman, toPersianDigits, toEnglishDigits } from "@/utils/format";
import {
  adminCard,
  adminDivider,
  adminInput,
  adminMutedSurface,
  adminSelectContent,
  adminSelectItem,
  adminSelectTrigger,
  adminTextMuted,
  adminTextPrimary,
  adminTextSecondary
} from "@/lib/adminTheme";
import InventoryHistoryTabs from "@/components/inventory/InventoryHistoryTabs";
import InventoryCategorySelect from "@/components/inventory/InventoryCategorySelect";
import type { InventoryLogRecord } from "@/lib/inventoryLogUtils";
import { findGroupForSubcategory } from "@/constants/inventoryCategories";

interface RawMaterial {
  id?: string;
  name: string;
  type?: "raw_material" | "packed_product";
  category: string;
  categoryGroup?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
  supplier?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface MenuItemUsage {
  id: string;
  menu_item_id: string;
  menuItemName: string;
  menuItemPrice?: number;
  quantity: number;
  unit: string;
  itemCost: number;
  costPercent?: number | null;
}

interface InventoryLog extends InventoryLogRecord {}

interface RawMaterialModalProps {
  material?: RawMaterial | null;
  isDark: boolean;
  onClose: () => void;
  onSave: (material: RawMaterial) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onOpenTransaction?: () => void;
}

const noSpinner =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]";

const sanitizeAmount = (val: string) => toEnglishDigits(val).replace(/\D/g, "");
const sanitizeDecimal = (val: string) => {
  const cleaned = toEnglishDigits(val).replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
};

const weightUnits = ["گرم", "کیلوگرم", "میلی‌لیتر", "لیتر"];
const numberUnits = ["عدد", "پاکت", "کیسه", "صندوق", "بطری"];

export const RawMaterialModal: React.FC<RawMaterialModalProps> = ({
  material,
  isDark,
  onClose,
  onSave,
  onDelete,
  onOpenTransaction
}) => {
  const { success, error: showError, warning } = useToast();
  const confirm = useConfirm();
  const isNewMaterial = !material?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemUsage[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [formData, setFormData] = useState<RawMaterial>(() => {
    const base = material || {
      name: "",
      type: "raw_material" as const,
      category: "",
      categoryGroup: "",
      unit: "گرم",
      currentStock: 0,
      minStock: 0,
      price: 0,
      supplier: ""
    };
    if (material && !material.categoryGroup && material.category) {
      const inferred = findGroupForSubcategory(material.category);
      if (inferred) return { ...base, categoryGroup: inferred };
    }
    return base;
  });

  const [priceInput, setPriceInput] = useState(
    material?.price ? toPersianDigits(String(material.price)) : ""
  );
  const [currentStockInput, setCurrentStockInput] = useState(
    material?.currentStock != null
      ? toPersianDigits(String(material.currentStock))
      : "۰"
  );
  const [minStockInput, setMinStockInput] = useState(
    material?.minStock != null
      ? toPersianDigits(String(material.minStock))
      : "۰"
  );

  const [unitType, setUnitType] = useState<"weight" | "number">(
    weightUnits.includes(material?.unit || "گرم") ? "weight" : "number"
  );

  const inputClass = cn(adminInput(isDark), "text-right");

  useEffect(() => {
    if (!material) return;
    const next = { ...material };
    if (!next.categoryGroup && next.category) {
      const inferred = findGroupForSubcategory(next.category);
      if (inferred) next.categoryGroup = inferred;
    }
    setFormData(next);
    setPriceInput(
      material.price ? toPersianDigits(String(material.price)) : ""
    );
    setCurrentStockInput(toPersianDigits(String(material.currentStock ?? 0)));
    setMinStockInput(toPersianDigits(String(material.minStock ?? 0)));
    setUnitType(weightUnits.includes(material.unit) ? "weight" : "number");
  }, [material]);

  useEffect(() => {
    if (!material?.id) return;
    const fetchUsage = async () => {
      setLoadingUsage(true);
      try {
        const response = await fetch(
          `/api/raw-materials/usage/${material.id}`,
          adminFetchInit()
        );
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching menu item usage:", error);
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchUsage();
  }, [material?.id]);

  useEffect(() => {
    if (!material?.id) return;
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const response = await fetch(
          `/api/products/${material.id}/inventory`,
          adminFetchInit()
        );
        if (response.ok) {
          const data = await response.json();
          setInventoryLogs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching inventory logs:", error);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [material?.id, material?.currentStock, material?.updatedAt]);

  const parsedPrice = parseInt(sanitizeAmount(priceInput), 10) || 0;
  const parsedCurrentStock =
    parseFloat(sanitizeDecimal(currentStockInput)) || 0;
  const parsedMinStock = parseFloat(sanitizeDecimal(minStockInput)) || 0;

  const priceInsights = useMemo(() => {
    if (!menuItems.length || parsedPrice <= 0) return null;
    const rows = menuItems.map(item => {
      const itemCost = item.quantity * parsedPrice;
      const menuPrice = item.menuItemPrice || 0;
      const costPercent =
        menuPrice > 0 ? Math.round((itemCost / menuPrice) * 100) : null;
      const margin = menuPrice > 0 ? menuPrice - itemCost : null;
      return { ...item, itemCost, costPercent, margin, menuPrice };
    });
    const highCost = rows.filter(
      r => r.costPercent != null && r.costPercent >= 40
    );
    return { rows, highCost };
  }, [menuItems, parsedPrice]);

  const handleCalculateUsage = async () => {
    if (!material?.id) return;
    setLoadingStats(true);
    try {
      const response = await fetch(
        "/api/raw-materials/calculate",
        adminFetchInit()
      );
      if (response.ok) {
        const data = await response.json();
        const stats = data.data.find((item: any) => item.id === material.id);
        setUsageStats(stats);
      }
    } catch (error) {
      console.error("Error calculating usage:", error);
      showError("خطا در محاسبه استفاده");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      !formData.categoryGroup?.trim()
    ) {
      warning("لطفاً نام، گروه و زیردسته را انتخاب کنید");
      return;
    }

    const payload: RawMaterial = {
      ...formData,
      price: parsedPrice,
      currentStock: parsedCurrentStock,
      minStock: parsedMinStock
    };

    setIsLoading(true);
    try {
      await onSave(payload);
      success(isNewMaterial ? "با موفقیت اضافه شد" : "با موفقیت ذخیره شد");
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      showError("خطا در ذخیره‌سازی");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!material?.id || !onDelete) return;
    const ok = await confirm({
      title: "حذف محصول",
      message: "آیا مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
      confirmLabel: "حذف",
      variant: "destructive"
    });
    if (!ok) return;
    setIsLoading(true);
    try {
      await onDelete(material.id);
      success("با موفقیت حذف شد");
      onClose();
    } catch (error) {
      console.error("Error deleting:", error);
      showError("خطا در حذف");
    } finally {
      setIsLoading(false);
    }
  };

  const isLowStock = parsedCurrentStock < parsedMinStock;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
          isDark ? "bg-neutral-900 border-white/10" : "bg-white"
        )}
        dir="rtl"
      >
        <DialogHeader
          className={cn("px-6 py-4 border-b shrink-0", adminDivider(isDark))}
        >
          <DialogTitle
            className={cn(
              "text-lg font-bold flex items-center gap-2",
              adminTextPrimary(isDark)
            )}
          >
            <Package size={20} className="text-coffee-500 shrink-0" />
            {isNewMaterial
              ? formData.type === "packed_product"
                ? "افزودن محصول بسته‌بندی"
                : "افزودن ماده اولیه"
              : formData.name}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {!isNewMaterial && isLowStock && (
            <div
              className={cn(
                "p-4 rounded-xl border flex gap-3",
                isDark
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-red-50 border-red-200"
              )}
            >
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <div>
                <p
                  className={cn(
                    "font-semibold text-sm",
                    isDark ? "text-red-400" : "text-red-700"
                  )}
                >
                  هشدار کم موجودی
                </p>
                <p className={cn("text-xs mt-0.5", adminTextMuted(isDark))}>
                  موجودی فعلی ({toPersianDigits(parsedCurrentStock.toString())})
                  کمتر از حداقل ({toPersianDigits(parsedMinStock.toString())})
                  است
                </p>
              </div>
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  className={cn(
                    "mb-1.5 block text-sm",
                    adminTextSecondary(isDark)
                  )}
                >
                  {formData.type === "packed_product"
                    ? "نام محصول *"
                    : "نام ماده اولیه *"}
                </Label>
                <Input
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder={
                    formData.type === "packed_product"
                      ? "مثلاً: کیک شکلاتی"
                      : "مثلاً: قهوه عربیکا"
                  }
                />
              </div>
            </div>

            <InventoryCategorySelect
              categoryGroup={formData.categoryGroup || ""}
              category={formData.category}
              onCategoryGroupChange={group =>
                setFormData(prev => ({
                  ...prev,
                  categoryGroup: group,
                  category: ""
                }))
              }
              onCategoryChange={sub =>
                setFormData(prev => ({ ...prev, category: sub }))
              }
              isDark={isDark}
            />

            <div>
              <Label
                className={cn(
                  "mb-1.5 block text-sm",
                  adminTextSecondary(isDark)
                )}
              >
                نوع محصول *
              </Label>
              <Select
                value={formData.type || "raw_material"}
                onValueChange={v =>
                  setFormData({
                    ...formData,
                    type:
                      v === "packed_product" ? "packed_product" : "raw_material"
                  })
                }
              >
                <SelectTrigger
                  className={cn(adminSelectTrigger(isDark), "w-full")}
                  dir="rtl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={adminSelectContent(isDark)} dir="rtl">
                  <SelectItem value="raw_material" className={adminSelectItem}>
                    مواد اولیه
                  </SelectItem>
                  <SelectItem
                    value="packed_product"
                    className={adminSelectItem}
                  >
                    محصول بسته‌بندی
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                className={cn(
                  "mb-1.5 block text-sm",
                  adminTextSecondary(isDark)
                )}
              >
                نوع واحد اندازه‌گیری
              </Label>
              <div className="flex gap-2">
                {(["weight", "number"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setUnitType(type);
                      setFormData({
                        ...formData,
                        unit:
                          type === "weight" ? weightUnits[0] : numberUnits[0]
                      });
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border",
                      unitType === type
                        ? "bg-coffee-600 text-white border-coffee-600"
                        : isDark
                          ? "bg-neutral-800 text-gray-400 border-white/10 hover:border-white/20"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {type === "weight" ? "وزن / حجم" : "عدد / تعداد"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label
                className={cn(
                  "mb-1.5 block text-sm",
                  adminTextSecondary(isDark)
                )}
              >
                واحد *
              </Label>
              <Select
                value={formData.unit}
                onValueChange={v => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger
                  className={cn(adminSelectTrigger(isDark), "w-full")}
                  dir="rtl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={adminSelectContent(isDark)} dir="rtl">
                  {(unitType === "weight" ? weightUnits : numberUnits).map(
                    unit => (
                      <SelectItem
                        key={unit}
                        value={unit}
                        className={adminSelectItem}
                      >
                        {unit}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label
                  className={cn(
                    "mb-1.5 block text-sm",
                    adminTextSecondary(isDark)
                  )}
                >
                  موجودی فعلی *
                </Label>
                <Input
                  inputMode="decimal"
                  value={currentStockInput}
                  onChange={e =>
                    setCurrentStockInput(
                      toPersianDigits(sanitizeDecimal(e.target.value))
                    )
                  }
                  className={cn(inputClass, noSpinner)}
                  dir="ltr"
                />
              </div>
              <div>
                <Label
                  className={cn(
                    "mb-1.5 block text-sm",
                    adminTextSecondary(isDark)
                  )}
                >
                  حداقل موجودی *
                </Label>
                <Input
                  inputMode="decimal"
                  value={minStockInput}
                  onChange={e =>
                    setMinStockInput(
                      toPersianDigits(sanitizeDecimal(e.target.value))
                    )
                  }
                  className={cn(inputClass, noSpinner)}
                  dir="ltr"
                />
              </div>
              <PriceInput
                label="قیمت"
                value={priceInput}
                onChange={(value, numericValue) => setPriceInput(value)}
                required
                placeholder="۰"
                min={1}
                labelClassName={cn("text-sm", adminTextSecondary(isDark))}
                inputClassName={cn(inputClass, noSpinner)}
              />
            </div>

            <div>
              <Label
                className={cn(
                  "mb-1.5 block text-sm",
                  adminTextSecondary(isDark)
                )}
              >
                تامین‌کننده
              </Label>
              <Input
                value={formData.supplier || ""}
                onChange={e =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                className={inputClass}
                placeholder="اختیاری"
              />
            </div>
          </form>

          {/* Price expert — menu cost vs selling price */}
          {!isNewMaterial && priceInsights && priceInsights.rows.length > 0 && (
            <div
              className={cn(
                "rounded-xl border p-4 space-y-3",
                adminCard(isDark)
              )}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-coffee-500" />
                <h4
                  className={cn("text-sm font-bold", adminTextPrimary(isDark))}
                >
                  تحلیل قیمت در منو
                </h4>
              </div>
              <p className={cn("text-xs", adminTextMuted(isDark))}>
                هزینه این ماده در هر آیتم منو نسبت به قیمت فروش
              </p>
              {priceInsights.highCost.length > 0 && (
                <div
                  className={cn(
                    "text-xs p-2.5 rounded-lg border",
                    isDark
                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                      : "bg-yellow-50 border-yellow-200 text-yellow-800"
                  )}
                >
                  {priceInsights.highCost.length} آیتم با هزینه ماده بالای ۴۰٪
                  قیمت فروش — بررسی قیمت‌گذاری توصیه می‌شود
                </div>
              )}
              <div className="space-y-2">
                {priceInsights.rows.map(row => (
                  <div
                    key={row.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg text-xs",
                      adminMutedSurface(isDark),
                      adminDivider(isDark)
                    )}
                  >
                    <div>
                      <p
                        className={cn("font-medium", adminTextPrimary(isDark))}
                      >
                        {row.menuItemName}
                      </p>
                      <p className={adminTextMuted(isDark)}>
                        {toPersianDigits(row.quantity.toString())} {row.unit} ×{" "}
                        {formatToman(parsedPrice)}
                      </p>
                    </div>
                    <div className="text-left space-y-0.5">
                      <p
                        className={
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        }
                      >
                        هزینه: {formatToman(Math.round(row.itemCost))}
                      </p>
                      {row.menuPrice > 0 && (
                        <>
                          <p className={adminTextSecondary(isDark)}>
                            فروش: {formatToman(row.menuPrice)}
                          </p>
                          <p
                            className={cn(
                              "font-semibold",
                              row.costPercent != null && row.costPercent >= 40
                                ? isDark
                                  ? "text-red-400"
                                  : "text-red-600"
                                : isDark
                                  ? "text-blue-400"
                                  : "text-blue-600"
                            )}
                          >
                            {row.costPercent != null
                              ? `${toPersianDigits(String(row.costPercent))}٪ از قیمت فروش`
                              : "—"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu usage list */}
          {!isNewMaterial && (
            <div className={cn("rounded-xl border p-4", adminCard(isDark))}>
              <div className="flex items-center justify-between mb-3">
                <p
                  className={cn("text-sm font-bold", adminTextPrimary(isDark))}
                >
                  موارد استفاده در منو
                </p>
                {loadingUsage && (
                  <Loader size={16} className="animate-spin text-coffee-500" />
                )}
              </div>
              {menuItems.length === 0 ? (
                <p className={cn("text-sm", adminTextMuted(isDark))}>
                  {loadingUsage
                    ? "در حال بارگذاری..."
                    : "در هیچ آیتم منویی استفاده نشده"}
                </p>
              ) : (
                <div className="space-y-2">
                  {menuItems.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex justify-between items-center p-3 rounded-lg text-sm",
                        adminMutedSurface(isDark)
                      )}
                    >
                      <div>
                        <p
                          className={cn(
                            "font-medium",
                            adminTextPrimary(isDark)
                          )}
                        >
                          {item.menuItemName}
                        </p>
                        <p className={cn("text-xs", adminTextMuted(isDark))}>
                          {toPersianDigits(item.quantity.toString())}{" "}
                          {item.unit}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        )}
                      >
                        {formatToman(Math.round(item.itemCost))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Usage stats */}
          {!isNewMaterial && (
            <div className={cn("rounded-xl border p-4", adminCard(isDark))}>
              <div className="flex items-center justify-between mb-3">
                <p
                  className={cn("text-sm font-bold", adminTextPrimary(isDark))}
                >
                  آمار مصرف
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateUsage}
                  disabled={loadingStats}
                  className="text-xs h-8"
                >
                  {loadingStats ? "در حال محاسبه..." : "محاسبه مصرف"}
                </Button>
              </div>
              {usageStats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={adminTextMuted(isDark)}>کل مصرف:</span>
                    <span className={adminTextPrimary(isDark)}>
                      {toPersianDigits(String(usageStats.totalUsage || 0))}{" "}
                      {formData.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={adminTextMuted(isDark)}>
                      تعداد سفارشات:
                    </span>
                    <span className={adminTextPrimary(isDark)}>
                      {toPersianDigits(String(usageStats.ordersCount || 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={cn("text-sm", adminTextMuted(isDark))}>
                  برای دیدن آمار مصرف واقعی، دکمه محاسبه را بزنید
                </p>
              )}
            </div>
          )}

          {/* Inventory history */}
          {!isNewMaterial && (
            <div className={cn("rounded-xl border p-4", adminCard(isDark))}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-coffee-500" />
                  <p
                    className={cn(
                      "text-sm font-bold",
                      adminTextPrimary(isDark)
                    )}
                  >
                    تاریخچه موجودی
                  </p>
                </div>
                {onOpenTransaction && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onOpenTransaction}
                    className="bg-coffee-600 hover:bg-coffee-500 text-white h-8"
                  >
                    <PackagePlus size={14} className="ml-1" />
                    عملیات موجودی
                  </Button>
                )}
              </div>
              {loadingLogs ? (
                <p
                  className={cn(
                    "text-sm py-4 text-center",
                    adminTextMuted(isDark)
                  )}
                >
                  در حال بارگذاری...
                </p>
              ) : (
                <InventoryHistoryTabs
                  logs={inventoryLogs}
                  unit={formData.unit}
                  isDark={isDark}
                  compact
                  emptyMessage="هنوز تغییری در موجودی ثبت نشده (با خرید، فروش یا بروزرسانی، تاریخچه ثبت می‌شود)"
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter
          className={cn(
            "px-6 py-4 border-t shrink-0 flex-row gap-2 sm:gap-2",
            adminDivider(isDark),
            isDark ? "bg-neutral-900/80" : "bg-gray-50"
          )}
        >
          <Button
            type="submit"
            form="product-form"
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save size={16} className="ml-1" />
            {isNewMaterial ? "ایجاد محصول" : "ذخیره تغییرات"}
          </Button>
          {!isNewMaterial && onDelete && (
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading}
              onClick={handleDelete}
              className="flex-1"
            >
              حذف
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {isNewMaterial ? "انصراف" : "بستن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
