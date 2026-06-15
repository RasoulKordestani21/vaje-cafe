"use client";

import React, { useMemo, useState } from "react";
import { Plus, Minus, Search, ShoppingCart, User, X } from "lucide-react";
import { MenuItem, ExternalProduct } from "@/types";
import { formatToman, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ManualOrderFormProps {
  items: MenuItem[];
  isDark: boolean;
  open: boolean;
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
  open,
  onSubmit,
  onClose
}) => {
  const [externalProducts, setExternalProducts] = useState<ExternalProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Array<{ itemId: string; quantity: number; type: "menu" | "external" }>
  >([]);

  React.useEffect(() => {
    if (!open) return;
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
  }, [open]);

  const allProducts: CombinedItem[] = useMemo(() => {
    const menuItems: CombinedItem[] = items.map(i => ({
      id: i.id!,
      name: i.name,
      price: i.price,
      type: "menu" as const
    }));
    const external: CombinedItem[] = externalProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      type: "external" as const
    }));
    return [...menuItems, ...external];
  }, [items, externalProducts]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  const handleAddItem = (itemId: string, type: "menu" | "external" = "menu") => {
    const existing = selectedItems.find(s => s.itemId === itemId && s.type === type);
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

  const handleRemoveItem = (itemId: string, type: "menu" | "external" = "menu") => {
    setSelectedItems(selectedItems.filter(s => !(s.itemId === itemId && s.type === type)));
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
      const item = allProducts.find(
        p => p.id === selected.itemId && p.type === selected.type
      );
      return total + (item?.price || 0) * selected.quantity;
    }, 0);
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setTableNumber("");
    setNotes("");
    setSelectedItems([]);
    setProductSearch("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

    onSubmit({
      customerName,
      customerPhone,
      customerEmail,
      tableNumber: tableNumber ? parseInt(tableNumber) : null,
      note: notes,
      items: selectedItems.map(s => {
        const item = allProducts.find(
          p => p.id === s.itemId && p.type === s.type
        );
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
    });
    resetForm();
  };

  const inputClass = cn(
    isDark
      ? "bg-neutral-900 border-white/10 text-white placeholder:text-gray-500"
      : "bg-white border-gray-200 text-gray-900"
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent
        className={cn(
          "max-w-4xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0",
          isDark ? "bg-[#1a1d24] border-white/10 text-white" : "bg-white"
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart size={20} className="text-coffee-500" />
            سفارش جدید
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left: form fields + product picker */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Customer info */}
              <section>
                <h3
                  className={cn(
                    "text-sm font-bold mb-3 flex items-center gap-2",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}
                >
                  <User size={16} className="text-coffee-500" />
                  اطلاعات مشتری
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">نام مشتری *</Label>
                    <Input
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="نام و نام خانوادگی"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">شماره تماس</Label>
                    <Input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      className={inputClass}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">شماره میز</Label>
                    <Input
                      type="number"
                      min="1"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      placeholder="اختیاری"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">ایمیل</Label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="اختیاری"
                      className={inputClass}
                      dir="ltr"
                    />
                  </div>
                </div>
              </section>

              {/* Product picker */}
              <section>
                <h3
                  className={cn(
                    "text-sm font-bold mb-3",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}
                >
                  انتخاب محصولات
                </h3>
                <div className="relative mb-3">
                  <Search
                    size={15}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}
                  />
                  <Input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="جستجوی محصول..."
                    className={cn(inputClass, "pr-9")}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {loadingProducts && externalProducts.length === 0 ? (
                    <p className="col-span-full text-sm text-center py-4 text-gray-500">
                      در حال بارگذاری...
                    </p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="col-span-full text-sm text-center py-4 text-gray-500">
                      محصولی یافت نشد
                    </p>
                  ) : (
                    filteredProducts.map(product => {
                      const isSelected = selectedItems.some(
                        s => s.itemId === product.id && s.type === product.type
                      );
                      return (
                        <button
                          key={`${product.type}-${product.id}`}
                          type="button"
                          onClick={() => handleAddItem(product.id, product.type)}
                          className={cn(
                            "p-3 rounded-xl border text-right transition-all text-sm",
                            isSelected
                              ? "border-coffee-500 bg-coffee-500/10 ring-1 ring-coffee-500/30"
                              : isDark
                                ? "border-white/10 hover:border-white/20 hover:bg-white/5"
                                : "border-gray-200 hover:border-coffee-300 hover:bg-coffee-50/50"
                          )}
                        >
                          <p className="font-semibold truncate">{product.name}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isDark ? "text-gray-400" : "text-gray-500"
                            )}
                          >
                            {formatToman(product.price)}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Notes */}
              <section>
                <Label className="text-xs mb-1.5 block">یادداشت</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="توضیحات اضافی..."
                  rows={2}
                  className={inputClass}
                />
              </section>
            </div>

            {/* Right: cart summary */}
            <div
              className={cn(
                "lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-r flex flex-col",
                isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50"
              )}
            >
              <div className="px-5 py-4 border-b border-inherit">
                <h3 className="text-sm font-bold">سبد سفارش</h3>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {toPersianDigits(selectedItems.length.toString())} آیتم
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-[120px]">
                {selectedItems.length === 0 ? (
                  <p
                    className={cn(
                      "text-sm text-center py-8",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    محصولی انتخاب نشده
                  </p>
                ) : (
                  selectedItems.map(selected => {
                    const item = allProducts.find(
                      p => p.id === selected.itemId && p.type === selected.type
                    );
                    return (
                      <div
                        key={`${selected.type}-${selected.itemId}`}
                        className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold leading-tight">
                            {item?.name}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(selected.itemId, selected.type)
                            }
                            className="text-red-400 hover:text-red-300 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  selected.itemId,
                                  selected.quantity - 1,
                                  selected.type
                                )
                              }
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center",
                                isDark ? "bg-white/10" : "bg-gray-100"
                              )}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">
                              {toPersianDigits(selected.quantity.toString())}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  selected.itemId,
                                  selected.quantity + 1,
                                  selected.type
                                )
                              }
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center",
                                isDark ? "bg-white/10" : "bg-gray-100"
                              )}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-coffee-500">
                            {formatToman((item?.price || 0) * selected.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div
                className={cn(
                  "px-5 py-4 border-t border-inherit",
                  isDark ? "bg-coffee-500/10" : "bg-coffee-50"
                )}
              >
                <p className="text-xs text-gray-500 mb-1">مجموع</p>
                <p className="text-2xl font-bold">{formatToman(calculateTotal())}</p>
              </div>
            </div>
          </div>

          <DialogFooter
            className={cn(
              "px-6 py-4 border-t shrink-0 gap-2 sm:gap-2",
              isDark ? "border-white/10" : "border-gray-100"
            )}
          >
            <Button type="button" variant="outline" onClick={handleClose}>
              لغو
            </Button>
            <Button
              type="submit"
              className="bg-coffee-600 hover:bg-coffee-500 text-white gap-2"
              disabled={selectedItems.length === 0}
            >
              <Plus size={16} />
              ثبت سفارش
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualOrderForm;
