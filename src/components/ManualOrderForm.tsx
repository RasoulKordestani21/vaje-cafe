"use client";

import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { MenuItem, ExternalProduct } from "@/types";
import { formatToman } from "@/utils/format";

interface ManualOrderFormProps {
  items: MenuItem[];
  isDark: boolean;
  onSubmit: (orderData: any) => void;
  onClose: () => void;
}

interface CombinedItem {
  id: string;
  name: string;
  price: number;
  type: "menu" | "external";
}

export const ManualOrderForm: React.FC<ManualOrderFormProps> = ({
  items,
  isDark,
  onSubmit,
  onClose
}) => {
  const [externalProducts, setExternalProducts] = useState<ExternalProduct[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchExternalProducts = async () => {
      try {
        const res = await fetch("/api/external-products");
        if (res.ok) {
          const data = await res.json();
          setExternalProducts(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch external products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchExternalProducts();
  }, []);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Array<{ itemId: string; quantity: number; type: "menu" | "external" }>
  >([]);

  const handleAddItem = (
    itemId: string,
    type: "menu" | "external" = "menu"
  ) => {
    const existing = selectedItems.find(
      s => s.itemId === itemId && s.type === type
    );
    if (existing) {
      setSelectedItems(
        selectedItems.map(s =>
          s.itemId === itemId && s.type === type
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      );
    } else {
      setSelectedItems([...selectedItems, { itemId, quantity: 1, type }]);
    }
  };

  const handleRemoveItem = (
    itemId: string,
    type: "menu" | "external" = "menu"
  ) => {
    setSelectedItems(
      selectedItems.filter(s => !(s.itemId === itemId && s.type === type))
    );
  };

  const handleQuantityChange = (
    itemId: string,
    quantity: number,
    type: "menu" | "external" = "menu"
  ) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId, type);
      return;
    }
    setSelectedItems(
      selectedItems.map(s =>
        s.itemId === itemId && s.type === type ? { ...s, quantity } : s
      )
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, selected) => {
      let item: MenuItem | ExternalProduct | undefined;

      if (selected.type === "menu") {
        item = items.find(i => i.id === selected.itemId);
      } else {
        item = externalProducts.find(p => p.id === selected.itemId);
      }
      return total + (item?.price || 0) * selected.quantity;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("لطفا نام مشتری را وارد کنید");
      return;
    }

    if (selectedItems.length === 0) {
      alert("لطفا حداقل یک محصول را انتخاب کنید");
      return;
    }

    const orderData = {
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      tableNumber: tableNumber ? parseInt(tableNumber) : null,
      note: notes,
      items: selectedItems.map(s => {
        let item: MenuItem | ExternalProduct | undefined;

        if (s.type === "menu") {
          item = items.find(i => i.id === s.itemId);
        } else {
          item = externalProducts.find(p => p.id === s.itemId);
        }

        return {
          menuItemId: s.itemId,
          name: item?.name,
          quantity: s.quantity,
          price: item?.price,
          subtotal: (item?.price || 0) * s.quantity,
          type: s.type
        };
      }),
      total: calculateTotal(),
      source: "manual",
      status: "pending"
    };

    onSubmit(orderData);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setTableNumber("");
    setNotes("");
    setSelectedItems([]);
  };

  const bgClass = isDark ? "dark:bg-neutral-800 bg-white" : "bg-white";
  const borderClass = isDark
    ? "dark:border-white/10 border-primary-200"
    : "border-primary-200";
  const textClass = isDark
    ? "dark:text-white text-primary-900"
    : "text-primary-900";
  const inputBgClass = isDark
    ? "dark:bg-neutral-900 bg-primary-50"
    : "bg-primary-50";
  const inputBorderClass = isDark
    ? "dark:border-white/20 border-primary-300"
    : "border-primary-300";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className={`${bgClass} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-6 border-b ${borderClass}`}
        >
          <h2 className={`text-2xl font-bold ${textClass}`}>سفارش جدید</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition"
          >
            <X size={24} className="text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className={`font-bold text-lg ${textClass}`}>اطلاعات مشتری</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="نام مشتری"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
                required
              />
              <input
                type="tel"
                placeholder="شماره تماس"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
              />
              <input
                type="number"
                placeholder="شماره میز (اختیاری)"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                min="1"
                className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
              />
              <input
                type="email"
                placeholder="ایمیل (اختیاری)"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
              />
            </div>
          </div>

          {/* Select Items */}
          <div className="space-y-4">
            <h3 className={`font-bold text-lg ${textClass}`}>محصولات</h3>

            {/* Menu Items */}
            <div>
              <h4 className={`text-sm font-semibold mb-2 ${textClass}`}>منو</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                {items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItem(item.id!, "menu")}
                    className={`p-3 rounded-lg border-2 border-dashed transition ${
                      selectedItems.some(
                        s => s.itemId === item.id && s.type === "menu"
                      )
                        ? "border-primary-500 bg-primary-100/30"
                        : borderClass
                    }`}
                  >
                    <div className={`text-sm font-semibold ${textClass}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatToman(item.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* External Products */}
            {!loadingProducts && externalProducts.length > 0 && (
              <div>
                <h4 className={`text-sm font-semibold mb-2 ${textClass}`}>
                  محصولات خارجی
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                  {externalProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddItem(product.id, "external")}
                      className={`p-3 rounded-lg border-2 border-dashed transition ${
                        selectedItems.some(
                          s => s.itemId === product.id && s.type === "external"
                        )
                          ? "border-amber-500 bg-amber-100/30"
                          : borderClass
                      }`}
                    >
                      <div className={`text-sm font-semibold ${textClass}`}>
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatToman(product.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="space-y-3">
              <h3 className={`font-bold text-lg ${textClass}`}>
                آیتم‌های انتخاب شده
              </h3>
              <div className="space-y-2">
                {selectedItems.map(selected => {
                  let item: MenuItem | ExternalProduct | undefined;

                  if (selected.type === "menu") {
                    item = items.find(i => i.id === selected.itemId);
                  } else {
                    item = externalProducts.find(p => p.id === selected.itemId);
                  }

                  return (
                    <div
                      key={`${selected.type}-${selected.itemId}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${borderClass}`}
                    >
                      <div>
                        <div className={`font-semibold ${textClass}`}>
                          {item?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatToman(item?.price || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={selected.quantity}
                          onChange={e =>
                            handleQuantityChange(
                              selected.itemId,
                              parseInt(e.target.value) || 1,
                              selected.type
                            )
                          }
                          className={`w-16 px-2 py-1 text-center rounded border ${inputBgClass} ${inputBorderClass} ${textClass}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveItem(selected.itemId, selected.type)
                          }
                          className="p-1 hover:bg-red-500/20 rounded transition"
                        >
                          <X size={18} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={`block font-semibold mb-2 ${textClass}`}>
              یادداشت
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="توضیحات اضافی..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} ${inputBorderClass} ${textClass}`}
            />
          </div>

          {/* Total */}
          <div
            className={`p-4 rounded-lg border-2 border-primary-500 ${
              isDark ? "bg-primary-500/10" : "bg-primary-100/30"
            }`}
          >
            <div className="text-sm text-gray-600 mb-1">مجموع:</div>
            <div className={`text-3xl font-bold ${textClass}`}>
              {formatToman(calculateTotal())}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100 transition"
            >
              لغو
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition flex items-center gap-2"
            >
              <Plus size={18} />
              ثبت سفارش
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualOrderForm;
