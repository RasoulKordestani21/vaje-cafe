"use client";

import React, { useState } from "react";
import { X, Save, Plus, Minus } from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  product: any;
  isDark?: boolean;
  onClose: () => void;
  onSave: (productId: string, newStock: number, note: string) => Promise<void>;
}

export default function StockAdjustmentModal({
  isOpen,
  product,
  isDark = true,
  onClose,
  onSave
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"set" | "add" | "remove">("set");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen || !product) return null;

  const currentStock = product.currentStock || 0;
  const calculatedStock =
    adjustmentType === "set"
      ? parseFloat(quantity) || 0
      : adjustmentType === "add"
      ? currentStock + (parseFloat(quantity) || 0)
      : currentStock - (parseFloat(quantity) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      alert("لطفا مقدار معتبری وارد کنید");
      return;
    }

    if (adjustmentType === "remove" && calculatedStock < 0) {
      alert("موجودی نمی‌تواند منفی باشد");
      return;
    }

    await onSave(product.id, calculatedStock, note || "تنظیم دستی موجودی");
    setQuantity("");
    setNote("");
    setAdjustmentType("set");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-xl ${
          isDark
            ? "bg-neutral-900 border-white/10"
            : "bg-white border-gray-300"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? "border-white/10 bg-neutral-900" : "border-gray-300 bg-white"
          }`}
        >
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            تنظیم موجودی: {product.name}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-neutral-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock Display */}
          <div
            className={`p-4 rounded-lg border ${
              isDark ? "bg-neutral-800 border-white/5" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                موجودی فعلی:
              </span>
              <span className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {toPersianDigits(currentStock.toString())} {product.unit}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                حداقل موجودی:
              </span>
              <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {toPersianDigits(product.minStock.toString())} {product.unit}
              </span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              نوع تنظیم
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("set")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  adjustmentType === "set"
                    ? "bg-coffee-600 text-white border-coffee-600"
                    : isDark
                    ? "bg-neutral-800 border-white/10 text-gray-300 hover:bg-neutral-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                تنظیم مقدار
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("add")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  adjustmentType === "add"
                    ? "bg-green-600 text-white border-green-600"
                    : isDark
                    ? "bg-neutral-800 border-white/10 text-gray-300 hover:bg-neutral-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Plus size={16} className="inline ml-1" />
                افزودن
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("remove")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  adjustmentType === "remove"
                    ? "bg-red-600 text-white border-red-600"
                    : isDark
                    ? "bg-neutral-800 border-white/10 text-gray-300 hover:bg-neutral-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Minus size={16} className="inline ml-1" />
                کسر
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              مقدار ({product.unit})
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="مقدار را وارد کنید"
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? "bg-neutral-800 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Calculated Stock Preview */}
          {quantity && (
            <div
              className={`p-4 rounded-lg border ${
                calculatedStock < product.minStock
                  ? isDark
                    ? "bg-red-900/20 border-red-500/30"
                    : "bg-red-50 border-red-300"
                  : isDark
                  ? "bg-emerald-900/20 border-emerald-500/30"
                  : "bg-emerald-50 border-emerald-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  موجودی جدید:
                </span>
                <span
                  className={`font-bold text-lg ${
                    calculatedStock < product.minStock
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {toPersianDigits(calculatedStock.toFixed(2))} {product.unit}
                </span>
              </div>
              {calculatedStock < product.minStock && (
                <p className={`text-xs mt-2 ${isDark ? "text-red-400" : "text-red-600"}`}>
                  ⚠️ موجودی جدید کمتر از حداقل است
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              یادداشت (اختیاری)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="یادداشت برای این تغییر..."
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? "bg-neutral-800 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-coffee-600 hover:bg-coffee-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save size={18} />
              ذخیره
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




