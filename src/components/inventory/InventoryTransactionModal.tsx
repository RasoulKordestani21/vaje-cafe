"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatToman, toEnglishDigits, toPersianDigits } from "@/utils/format";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminCard,
  adminDivider,
  adminInput,
  adminTextMuted,
  adminTextPrimary,
} from "@/lib/adminTheme";

export type InventoryTransactionOperation = "buy" | "sell" | "update";

interface ProductInfo {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  price?: number;
}

interface InventoryTransactionModalProps {
  isOpen: boolean;
  product: ProductInfo | null;
  isDark?: boolean;
  onClose: () => void;
  onSave: (payload: {
    productId: string;
    operation: InventoryTransactionOperation;
    quantity: number;
    unitPrice?: number;
    note?: string;
  }) => Promise<void>;
}

const sanitizeDecimal = (val: string) => {
  const cleaned = toEnglishDigits(val).replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
};

const sanitizeAmount = (val: string) =>
  toEnglishDigits(val).replace(/\D/g, "");

export default function InventoryTransactionModal({
  isOpen,
  product,
  isDark = true,
  onClose,
  onSave,
}: InventoryTransactionModalProps) {
  const { warning } = useToast();
  const [operation, setOperation] = useState<InventoryTransactionOperation>("buy");
  const [quantityInput, setQuantityInput] = useState("");
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) return;
    setOperation("buy");
    setQuantityInput("");
    setUnitPriceInput(
      product.price ? toPersianDigits(String(product.price)) : ""
    );
    setNote("");
  }, [isOpen, product]);

  const parsedQuantity = parseFloat(sanitizeDecimal(quantityInput)) || 0;
  const parsedUnitPrice = parseInt(sanitizeAmount(unitPriceInput), 10) || 0;

  const preview = useMemo(() => {
    if (!product) return null;
    const current = product.currentStock || 0;

    if (operation === "buy") {
      return {
        newStock: current + parsedQuantity,
        totalPrice: parsedUnitPrice * parsedQuantity,
      };
    }
    if (operation === "sell") {
      return {
        newStock: current - parsedQuantity,
        totalPrice: parsedUnitPrice * parsedQuantity,
      };
    }
    return {
      newStock: parsedQuantity,
      totalPrice: null,
    };
  }, [product, operation, parsedQuantity, parsedUnitPrice]);

  if (!isOpen || !product) return null;

  const inputClass = cn(adminInput(isDark), "text-right");
  const currentStock = product.currentStock || 0;

  const tabTriggerClass = cn(
    "rounded-lg px-3 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all",
    isDark
      ? "data-[state=inactive]:text-gray-400 data-[state=active]:bg-coffee-600 data-[state=active]:text-white"
      : "data-[state=inactive]:text-gray-600 data-[state=active]:bg-coffee-600 data-[state=active]:text-white"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (operation === "update") {
      if (parsedQuantity < 0) {
        warning("مقدار موجودی نامعتبر است");
        return;
      }
    } else if (parsedQuantity <= 0) {
      warning("لطفا مقدار معتبری وارد کنید");
      return;
    }

    if (operation === "sell" && parsedQuantity > currentStock) {
      warning("موجودی کافی نیست");
      return;
    }

    if (preview && preview.newStock < 0) {
      warning("موجودی نمی‌تواند منفی باشد");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        productId: product.id,
        operation,
        quantity: parsedQuantity,
        unitPrice:
          operation === "update"
            ? undefined
            : parsedUnitPrice > 0
              ? parsedUnitPrice
              : product.price,
        note: note.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden",
          isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-300"
        )}
        dir="rtl"
      >
        <div
          className={cn(
            "flex items-center justify-between px-6 py-4 border-b",
            adminDivider(isDark)
          )}
        >
          <div>
            <h2 className={cn("text-lg font-bold", adminTextPrimary(isDark))}>
              عملیات موجودی
            </h2>
            <p className={cn("text-sm mt-0.5", adminTextMuted(isDark))}>
              {product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark
                ? "hover:bg-neutral-800 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            )}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className={cn("rounded-xl border p-4", adminCard(isDark))}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDark ? "bg-coffee-600/20" : "bg-coffee-100"
                )}
              >
                <Package size={20} className="text-coffee-500" />
              </div>
              <div className="flex-1">
                <p className={cn("text-xs", adminTextMuted(isDark))}>
                  موجودی فعلی
                </p>
                <p className={cn("text-xl font-bold", adminTextPrimary(isDark))}>
                  {toPersianDigits(currentStock.toFixed(2))}{" "}
                  <span className="text-sm font-normal">{product.unit}</span>
                </p>
              </div>
              {product.minStock != null && product.minStock > 0 && (
                <div className="text-left">
                  <p className={cn("text-xs", adminTextMuted(isDark))}>حداقل</p>
                  <p className={cn("text-sm font-semibold", adminTextPrimary(isDark))}>
                    {toPersianDigits(String(product.minStock))}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Tabs
            value={operation}
            onValueChange={value =>
              setOperation(value as InventoryTransactionOperation)
            }
          >
            <TabsList
              className={cn(
                "grid w-full grid-cols-3 h-auto p-1 rounded-xl",
                isDark ? "bg-white/5" : "bg-gray-100"
              )}
            >
              <TabsTrigger value="buy" className={tabTriggerClass}>
                <TrendingUp size={16} />
                خرید
              </TabsTrigger>
              <TabsTrigger value="sell" className={tabTriggerClass}>
                <TrendingDown size={16} />
                فروش
              </TabsTrigger>
              <TabsTrigger value="update" className={tabTriggerClass}>
                <RefreshCw size={16} />
                بروزرسانی
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-4 space-y-4">
              <p className={cn("text-xs", adminTextMuted(isDark))}>
                افزایش موجودی با ثبت مقدار و قیمت خرید
              </p>
              <QuantityPriceFields
                operation="buy"
                product={product}
                quantityInput={quantityInput}
                unitPriceInput={unitPriceInput}
                onQuantityChange={setQuantityInput}
                onUnitPriceChange={setUnitPriceInput}
                inputClass={inputClass}
                isDark={isDark}
              />
            </TabsContent>

            <TabsContent value="sell" className="mt-4 space-y-4">
              <p className={cn("text-xs", adminTextMuted(isDark))}>
                کاهش موجودی با ثبت مقدار و قیمت فروش
              </p>
              <QuantityPriceFields
                operation="sell"
                product={product}
                quantityInput={quantityInput}
                unitPriceInput={unitPriceInput}
                onQuantityChange={setQuantityInput}
                onUnitPriceChange={setUnitPriceInput}
                inputClass={inputClass}
                isDark={isDark}
              />
            </TabsContent>

            <TabsContent value="update" className="mt-4 space-y-4">
              <p className={cn("text-xs", adminTextMuted(isDark))}>
                تنظیم مستقیم موجودی فعلی (مقدار جدید)
              </p>
              <div>
                <label className={cn("block text-sm font-medium mb-2", adminTextPrimary(isDark))}>
                  موجودی جدید ({product.unit})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityInput}
                  onChange={e =>
                    setQuantityInput(toPersianDigits(sanitizeDecimal(e.target.value)))
                  }
                  placeholder="مقدار جدید موجودی"
                  className={inputClass}
                />
              </div>
            </TabsContent>
          </Tabs>

          {preview && (parsedQuantity > 0 || operation === "update") && (
            <div
              className={cn(
                "rounded-xl border p-4 space-y-2",
                preview.newStock < (product.minStock || 0)
                  ? isDark
                    ? "bg-red-900/20 border-red-500/30"
                    : "bg-red-50 border-red-300"
                  : isDark
                    ? "bg-emerald-900/20 border-emerald-500/30"
                    : "bg-emerald-50 border-emerald-300"
              )}
            >
              <div className="flex justify-between items-center text-sm">
                <span className={adminTextMuted(isDark)}>موجودی پس از عملیات:</span>
                <span
                  className={cn(
                    "font-bold text-lg",
                    preview.newStock < (product.minStock || 0)
                      ? "text-red-400"
                      : "text-emerald-400"
                  )}
                >
                  {toPersianDigits(preview.newStock.toFixed(2))} {product.unit}
                </span>
              </div>
              {preview.totalPrice != null && preview.totalPrice > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className={adminTextMuted(isDark)}>مبلغ کل:</span>
                  <span className={cn("font-bold", adminTextPrimary(isDark))}>
                    {formatToman(preview.totalPrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className={cn("block text-sm font-medium mb-2", adminTextPrimary(isDark))}>
              یادداشت (اختیاری)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="توضیحات این عملیات..."
              className={cn(inputClass, "resize-none min-h-[72px]")}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-coffee-600 hover:bg-coffee-500 disabled:opacity-60 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              {operation === "buy" ? (
                <ShoppingCart size={18} />
              ) : operation === "sell" ? (
                <TrendingDown size={18} />
              ) : (
                <Save size={18} />
              )}
              {submitting
                ? "در حال ثبت..."
                : operation === "buy"
                  ? "ثبت خرید"
                  : operation === "sell"
                    ? "ثبت فروش"
                    : "بروزرسانی موجودی"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-colors font-medium",
                isDark
                  ? "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              )}
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuantityPriceFields({
  operation,
  product,
  quantityInput,
  unitPriceInput,
  onQuantityChange,
  onUnitPriceChange,
  inputClass,
  isDark,
}: {
  operation: "buy" | "sell";
  product: ProductInfo;
  quantityInput: string;
  unitPriceInput: string;
  onQuantityChange: (v: string) => void;
  onUnitPriceChange: (v: string) => void;
  inputClass: string;
  isDark: boolean;
}) {
  const parsedQty = parseFloat(sanitizeDecimal(quantityInput)) || 0;
  const parsedPrice = parseInt(sanitizeAmount(unitPriceInput), 10) || 0;
  const total = parsedQty * parsedPrice;

  return (
    <div className="space-y-4">
      <div>
        <label className={cn("block text-sm font-medium mb-2", adminTextPrimary(isDark))}>
          مقدار ({product.unit})
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={quantityInput}
          onChange={e =>
            onQuantityChange(toPersianDigits(sanitizeDecimal(e.target.value)))
          }
          placeholder={operation === "buy" ? "مقدار خرید" : "مقدار فروش"}
          className={inputClass}
        />
      </div>
      <div>
        <label className={cn("block text-sm font-medium mb-2", adminTextPrimary(isDark))}>
          قیمت واحد (تومان)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={unitPriceInput}
          onChange={e =>
            onUnitPriceChange(toPersianDigits(sanitizeAmount(e.target.value)))
          }
          placeholder="قیمت هر واحد"
          className={inputClass}
        />
      </div>
      {parsedQty > 0 && parsedPrice > 0 && (
        <div className={cn("text-sm flex justify-between", adminTextMuted(isDark))}>
          <span>جمع {operation === "buy" ? "خرید" : "فروش"}:</span>
          <span className={cn("font-bold", adminTextPrimary(isDark))}>
            {formatToman(total)}
          </span>
        </div>
      )}
    </div>
  );
}
