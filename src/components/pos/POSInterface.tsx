"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Wallet, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatToman, toPersianDigits } from "@/utils/format";
import { useToast } from "@/components/ui/toast";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  inStockFromInventory?: boolean;
  imageUrl?: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface POSInterfaceProps {
  isDark?: boolean;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ isDark = true }) => {
  const { success, error: showError, warning } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (response.ok) {
        const items = await response.json();
        setMenuItems(
          items.filter(
            (item: MenuItem) => item.available && item.inStockFromInventory !== false
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.menuItemId === menuItemId);
      if (!item) return prev;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter((i) => i.menuItemId !== menuItemId);
      }

      return prev.map((i) =>
        i.menuItemId === menuItemId
          ? { ...i, quantity: newQuantity }
          : i
      );
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      warning("سبد خرید خالی است");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          tableNumber: tableNumber ? parseInt(tableNumber) : null,
          source: "pos",
          total: getTotal(),
          note: `پرداخت: ${paymentMethod === "cash" ? "نقدی" : paymentMethod === "card" ? "کارت" : "آنلاین"}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در ثبت سفارش");
      }

      // Success - clear cart and reset
      clearCart();
      setTableNumber("");
      setPaymentMethod("cash");
      success("سفارش با موفقیت ثبت شد");
    } catch (error: any) {
      showError(error.message || "خطا در ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))];
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={cn("min-h-screen", isDark ? "bg-neutral-950" : "bg-gray-50")}>
      <div className="flex h-screen overflow-hidden">
        {/* Left Side - Menu Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className={cn(
            "p-4 border-b",
            isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200"
          )}>
            <h1 className="text-2xl font-bold mb-4" style={{ color: isDark ? "#fff" : "#000" }}>
              سیستم فروش (POS)
            </h1>
            
            {/* Search */}
            <Input
              placeholder="جستجوی محصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "mb-4",
                isDark
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "bg-white border-gray-300"
              )}
            />

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    selectedCategory === cat
                      ? "bg-coffee-600 text-white"
                      : isDark
                      ? "bg-neutral-800 text-gray-300 border-neutral-700"
                      : "bg-white text-gray-700 border-gray-300"
                  )}
                >
                  {cat === "all" ? "همه" : cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-20">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>در حال بارگذاری...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>محصولی یافت نشد</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:scale-105 transition-transform",
                      isDark
                        ? "bg-neutral-900 border-white/10 hover:border-coffee-500/50"
                        : "bg-white border-gray-200 hover:border-coffee-500"
                    )}
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className={cn(
                        "font-semibold text-sm mb-1 line-clamp-2",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {item.name}
                      </h3>
                      <p className={cn(
                        "text-xs font-bold",
                        isDark ? "text-coffee-400" : "text-coffee-600"
                      )}>
                        {formatToman(item.price)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className={cn(
          "w-96 flex flex-col border-l",
          isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="p-4 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={20} style={{ color: isDark ? "#fff" : "#000" }} />
              <h2 className="text-xl font-bold" style={{ color: isDark ? "#fff" : "#000" }}>
                سبد خرید
              </h2>
            </div>

            {/* Table Number */}
            <div className="mb-4">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>
                شماره میز (اختیاری)
              </Label>
              <Input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="مثال: 5"
                className={cn(
                  "mt-1",
                  isDark
                    ? "bg-neutral-800 border-neutral-700 text-white"
                    : "bg-white border-gray-300"
                )}
              />
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <Label className={isDark ? "text-gray-300" : "text-gray-700"}>
                روش پرداخت
              </Label>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => setPaymentMethod("cash")}
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1",
                    paymentMethod === "cash"
                      ? "bg-coffee-600 text-white"
                      : isDark
                      ? "bg-neutral-800 text-gray-300 border-neutral-700"
                      : "bg-white text-gray-700 border-gray-300"
                  )}
                >
                  <Wallet size={16} className="ml-1" />
                  نقدی
                </Button>
                <Button
                  onClick={() => setPaymentMethod("card")}
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1",
                    paymentMethod === "card"
                      ? "bg-coffee-600 text-white"
                      : isDark
                      ? "bg-neutral-800 text-gray-300 border-neutral-700"
                      : "bg-white text-gray-700 border-gray-300"
                  )}
                >
                  <CreditCard size={16} className="ml-1" />
                  کارت
                </Button>
                <Button
                  onClick={() => setPaymentMethod("online")}
                  variant={paymentMethod === "online" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1",
                    paymentMethod === "online"
                      ? "bg-coffee-600 text-white"
                      : isDark
                      ? "bg-neutral-800 text-gray-300 border-neutral-700"
                      : "bg-white text-gray-700 border-gray-300"
                  )}
                >
                  <CreditCard size={16} className="ml-1" />
                  آنلاین
                </Button>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" style={{ color: isDark ? "#fff" : "#000" }} />
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>سبد خرید خالی است</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card
                    key={item.menuItemId}
                    className={cn(
                      isDark
                        ? "bg-neutral-800 border-white/10"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-semibold text-sm",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            {item.name}
                          </h4>
                          <p className={cn(
                            "text-xs mt-1",
                            isDark ? "text-gray-400" : "text-gray-600"
                          )}>
                            {formatToman(item.price)} × {toPersianDigits(item.quantity.toString())}
                          </p>
                        </div>
                        <Button
                          onClick={() => removeFromCart(item.menuItemId)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Minus size={14} />
                          </Button>
                          <span className={cn(
                            "font-bold w-8 text-center",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            {toPersianDigits(item.quantity.toString())}
                          </span>
                          <Button
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                        <p className={cn(
                          "font-bold",
                          isDark ? "text-coffee-400" : "text-coffee-600"
                        )}>
                          {formatToman(item.price * item.quantity)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className={cn(
            "p-4 border-t",
            isDark ? "bg-neutral-900 border-white/10" : "bg-white border-gray-200"
          )}>
            <div className="flex justify-between items-center mb-4">
              <span className={cn("text-lg font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
                مجموع:
              </span>
              <span className={cn("text-2xl font-bold", isDark ? "text-coffee-400" : "text-coffee-600")}>
                {formatToman(getTotal())}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={clearCart}
                variant="outline"
                className={cn(
                  "flex-1",
                  isDark
                    ? "bg-neutral-800 text-gray-300 border-neutral-700 hover:bg-neutral-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
                disabled={cart.length === 0}
              >
                <X size={18} className="ml-2" />
                پاک کردن
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || submitting}
                className="flex-1 bg-coffee-600 hover:bg-coffee-500 text-white"
              >
                {submitting ? (
                  "در حال ثبت..."
                ) : (
                  <>
                    <Check size={18} className="ml-2" />
                    ثبت سفارش
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSInterface;



