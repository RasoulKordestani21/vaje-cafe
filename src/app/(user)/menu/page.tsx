"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useCustomer } from "@/context/CustomerContext";
import { useCart } from "@/context/CartContext";
import { CATEGORIES, MenuItem } from "@/types";
import { formatToman } from "@/utils/format";
// import { cn } from "@/lib/utils";
import { ShoppingBag, Loader2, ShoppingCart, Pin, Star } from "lucide-react";
import { recordMenuView } from "@/services/visitService";
import CustomerAuthButton from "@/components/customer/CustomerAuthButton";
import MenuSearch from "@/components/menu/MenuSearch";
import PreviousOrders from "@/components/menu/PreviousOrders";
import RatingSystem from "@/components/ratings/RatingSystem";
import ReviewsList from "@/components/ratings/ReviewsList";
import MenuItemComments from "@/components/menu/MenuItemComments";

export default function MenuPage() {
  const router = useRouter();
  const { items, addOrder, isLoading } = useMenu();
  const { customer, isAuthenticated: isCustomerAuthenticated, authChecked } = useCustomer();
  const { items: cartItems, addItem: addToCart, removeItem: removeFromCart, updateQuantity, clearCart, getTotalItems } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("همه");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Track menu page visit
  useEffect(() => {
    recordMenuView();
  }, []);
  // Filter by category first
  const categoryFilteredItems =
    activeCategory === "همه"
      ? items
      : items.filter(item => item.category === activeCategory);

  // Filter by search query (case-insensitive, search in name and description)
  const filteredItems = searchQuery.trim()
    ? categoryFilteredItems.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = item.name?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        return nameMatch || descMatch;
      })
    : categoryFilteredItems;

  // Get all available items from filtered results
  const allAvailableItems = filteredItems.filter(item => item.available);

  // Helper function to safely check if item is pinned or suggested
  const isPinned = (item: MenuItem) => Boolean((item as any).is_pinned);
  const isSuggested = (item: MenuItem) => Boolean((item as any).is_suggested);

  // Separate pinned, suggested, and regular items (only when no search/category filter)
  const pinnedItems = !searchQuery.trim() && activeCategory === "همه"
    ? allAvailableItems.filter(item => isPinned(item))
    : [];
  const suggestedItems = !searchQuery.trim() && activeCategory === "همه"
    ? allAvailableItems.filter(item => isSuggested(item) && !isPinned(item))
    : [];
  const regularItems = !searchQuery.trim() && activeCategory === "همه"
    ? allAvailableItems.filter(item => !isPinned(item) && !isSuggested(item))
    : [];
  
  // For search/category filter, show all matching items
  // When no filters, regularItems will be shown in "همه محصولات" section
  // (pinned and suggested are shown in their own sections above)
  const availableItems = searchQuery.trim() || activeCategory !== "همه"
    ? allAvailableItems
    : regularItems;

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-coffee-500/30 text-coffee-200 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleAddToCart = (itemId: string) => {
    if (!authChecked) return; // Wait for auth check
    
    if (!isCustomerAuthenticated) {
      if (confirm("برای افزودن محصول به سبد خرید باید وارد شوید. آیا می‌خواهید وارد شوید؟")) {
        router.push("/customer/login");
      }
      return;
    }
    
    addToCart(itemId, 1);
  };

  const handleQuickOrder = (item: any) => {
    if (!authChecked) return;
    
    if (!isCustomerAuthenticated) {
      if (confirm("برای سفارش باید وارد شوید. آیا می‌خواهید وارد شوید؟")) {
        router.push("/customer/login");
      }
      return;
    }
    
    addToCart(item.id!, 1);
    setShowOrderForm(true);
  };

  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(itemId);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, cartItem) => {
      const item = items.find(i => i.id === cartItem.itemId);
      return total + (item?.price || 0) * cartItem.quantity;
    }, 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCustomerAuthenticated) {
      alert("لطفا ابتدا وارد شوید");
      router.push("/customer/login");
      return;
    }

    if (!tableNumber.trim()) {
      alert("لطفا شماره میز را انتخاب کنید");
      return;
    }

    if (cartItems.length === 0) {
      alert("لطفا حداقل یک محصول را انتخاب کنید");
      return;
    }

    try {
      const orderItems = cartItems.map(cartItem => {
        const item = items.find(i => i.id === cartItem.itemId);
        return {
          menuItemId: cartItem.itemId,
          name: item?.name || "Unknown Item",
          quantity: cartItem.quantity,
          price: item?.price || 0
        };
      });

      await addOrder(orderItems, notes, {
        customerName: customer?.name || "مشتری",
        customerPhone: customer?.phoneNumber || "",
        customerEmail: "",
        tableNumber
      });
      
      alert("سفارش شما ثبت شد!");

      // Reset form and clear cart
      setShowOrderForm(false);
      clearCart();
      setTableNumber("");
      setNotes("");
    } catch (error) {
      alert("خطا در ثبت سفارش");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen dark:bg-neutral-950 bg-primary-500" dir="rtl">
      {/* Header */}
      <div className="bg-neutral-900/50 py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <div className="text-center flex-1">
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-6 font-bold">
                منوی کافه واژه
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-8">
                انتخابی دقیق از بهترین طعم‌ها برای سلیقه‌های خاص.
              </p>
            </div>
            <div className="flex-1 flex justify-end items-center gap-4">
              <CustomerAuthButton />
              {isCustomerAuthenticated && (
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="relative bg-coffee-600 hover:bg-coffee-500 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <ShoppingCart size={20} />
                  <span>سبد خرید</span>
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <MenuSearch
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          isDark={true}
          placeholder="جستجوی محصولات (نام یا توضیحات)..."
        />

        <div className="flex flex-col lg:flex-row gap-12 mt-8">
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-1/4 space-y-8">
            <div className="sticky top-28 space-y-8">
              {/* Previous Orders - Only show for authenticated customers */}
              {isCustomerAuthenticated && customer && (
                <PreviousOrders customerId={customer.id} isDark={true} />
              )}

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-coffee-100 font-bold mb-4 text-lg">
                  دسته‌بندی‌ها
                </h3>
                <button
                  onClick={() => setActiveCategory("همه")}
                  className={`block w-full text-right px-4 py-3 rounded-lg transition-colors font-medium ${
                    activeCategory === "همه"
                      ? "bg-coffee-600 text-white shadow-lg shadow-coffee-900/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  همه موارد
                </button>
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`block w-full text-right px-4 py-3 rounded-lg transition-colors font-medium ${
                      activeCategory === category
                        ? "bg-coffee-600 text-white shadow-lg shadow-coffee-900/20"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="w-full lg:w-3/4 space-y-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-coffee-500 w-10 h-10" />
              </div>
            ) : (
              <>
                {/* Pinned Items Section - Only show when no search/category filter */}
                {!searchQuery.trim() && activeCategory === "همه" && pinnedItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Pin size={24} className="text-yellow-400" fill="currentColor" />
                        محصولات ویژه
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pinnedItems.map(item => (
                        <div
                          key={item.id}
                          className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-coffee-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col"
                        >
                          <div className="h-56 overflow-hidden relative w-full">
                            <img
                              src={
                                item.imageUrl ||
                                `https://picsum.photos/400/300?random=${item.id}`
                              }
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80"></div>
                            <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                              <div className="flex items-center gap-2">
                                <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 font-medium">
                                  {item.category}
                                </span>
                                {isPinned(item) && (
                                  <span className="bg-yellow-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                    <Pin size={12} fill="currentColor" />
                                    ویژه
                                  </span>
                                )}
                                {isSuggested(item) && (
                                  <span className="bg-blue-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                    <Star size={12} fill="currentColor" />
                                    پیشنهاد
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleQuickOrder(item)}
                                  className="bg-coffee-600 hover:bg-coffee-500 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                                >
                                  <ShoppingBag size={20} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-serif text-xl text-white group-hover:text-coffee-400 transition-colors font-bold">
                                  {searchQuery ? highlightText(item.name || "", searchQuery) : item.name}
                                </h3>
                                <span className="font-serif text-lg text-coffee-300 font-bold">
                                  {formatToman(item.price)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 leading-7 line-clamp-3">
                                {searchQuery && item.description
                                  ? highlightText(item.description, searchQuery)
                                  : item.description}
                              </p>
                              <div className="mt-3">
                                <RatingSystem
                                  menuItemId={item.id!}
                                  isDark={true}
                                  showAverage={true}
                                  size="sm"
                                />
                              </div>
                              {/* Show approved reviews */}
                              <div className="mt-3">
                                <ReviewsList
                                  menuItemId={item.id!}
                                  isDark={true}
                                  maxReviews={2}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item.id!)}
                              className="mt-4 w-full bg-coffee-600 hover:bg-coffee-500 text-white py-2 rounded-lg transition-colors font-medium"
                            >
                              افزودن به سفارش
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Items Section - Only show when no search/category filter */}
                {!searchQuery.trim() && activeCategory === "همه" && suggestedItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Star size={24} className="text-blue-400" fill="currentColor" />
                        پیشنهاد امروز
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {suggestedItems.map(item => (
                        <div
                          key={item.id}
                          className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-coffee-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col"
                        >
                          <div className="h-56 overflow-hidden relative w-full">
                            <img
                              src={
                                item.imageUrl ||
                                `https://picsum.photos/400/300?random=${item.id}`
                              }
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80"></div>
                            <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                              <div className="flex items-center gap-2">
                                <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 font-medium">
                                  {item.category}
                                </span>
                                <span className="bg-blue-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                  <Star size={12} fill="currentColor" />
                                  پیشنهاد
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleQuickOrder(item)}
                                  className="bg-coffee-600 hover:bg-coffee-500 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                                >
                                  <ShoppingBag size={20} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-serif text-xl text-white group-hover:text-coffee-400 transition-colors font-bold">
                                  {item.name}
                                </h3>
                                <span className="font-serif text-lg text-coffee-300 font-bold">
                                  {formatToman(item.price)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 leading-7 line-clamp-3">
                                {item.description}
                              </p>
                              <div className="mt-3">
                                <RatingSystem
                                  menuItemId={item.id!}
                                  isDark={true}
                                  showAverage={true}
                                  size="sm"
                                />
                              </div>
                              {/* Show approved reviews */}
                              <div className="mt-3">
                                <ReviewsList
                                  menuItemId={item.id!}
                                  isDark={true}
                                  maxReviews={2}
                                />
                              </div>
                              {/* Menu Item Comments */}
                              <div className="mt-3 border-t border-white/5 pt-3">
                                <MenuItemComments
                                  menuItemId={item.id!}
                                  menuItemName={item.name || ""}
                                  isDark={true}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item.id!)}
                              className="mt-4 w-full bg-coffee-600 hover:bg-coffee-500 text-white py-2 rounded-lg transition-colors font-medium"
                            >
                              افزودن به سفارش
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Items Section - Show all items when filtering, or regular items when no filter */}
                {(availableItems.length > 0 || (searchQuery.trim() || activeCategory !== "همه")) && (
                  <div className="space-y-4">
                    {(!searchQuery.trim() && activeCategory === "همه") && (
                      <h2 className="text-2xl font-bold text-white">همه محصولات</h2>
                    )}
                    {availableItems.length === 0 && (searchQuery.trim() || activeCategory !== "همه") ? (
                      <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
                        <p className="text-gray-500 text-lg">
                          {searchQuery
                            ? `نتیجه‌ای برای "${searchQuery}" یافت نشد.`
                            : "در حال حاضر آیتمی در این دسته موجود نیست."}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setActiveCategory("همه");
                            }}
                            className="mt-4 px-6 py-2 bg-coffee-600 hover:bg-coffee-500 text-white rounded-lg transition-colors"
                          >
                            پاک کردن فیلترها
                          </button>
                        )}
                      </div>
                    ) : availableItems.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {availableItems.map(item => (
                          <div
                            key={item.id}
                            className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-coffee-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col"
                          >
                            <div className="h-56 overflow-hidden relative w-full">
                              <img
                                src={
                                  item.imageUrl ||
                                  `https://picsum.photos/400/300?random=${item.id}`
                                }
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80"></div>
                              <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                  <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 font-medium">
                                    {item.category}
                                  </span>
                                  {isPinned(item) && (
                                    <span className="bg-yellow-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                      <Pin size={12} fill="currentColor" />
                                      ویژه
                                    </span>
                                  )}
                                  {isSuggested(item) && (
                                    <span className="bg-blue-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                      <Star size={12} fill="currentColor" />
                                      پیشنهاد
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleQuickOrder(item)}
                                    className="bg-coffee-600 hover:bg-coffee-500 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                                  >
                                    <ShoppingBag size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="p-6 flex-grow flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-serif text-xl text-white group-hover:text-coffee-400 transition-colors font-bold">
                                    {searchQuery ? highlightText(item.name || "", searchQuery) : item.name}
                                  </h3>
                                  <span className="font-serif text-lg text-coffee-300 font-bold">
                                    {formatToman(item.price)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 leading-7 line-clamp-3">
                                  {searchQuery && item.description
                                    ? highlightText(item.description, searchQuery)
                                    : item.description}
                                </p>
                                {/* Show ratings for all items */}
                                <div className="mt-3">
                                  <RatingSystem
                                    menuItemId={item.id!}
                                    isDark={true}
                                    showAverage={true}
                                    size="sm"
                                  />
                                </div>
                                {/* Show approved reviews */}
                                <div className="mt-3">
                                  <ReviewsList
                                    menuItemId={item.id!}
                                    isDark={true}
                                    maxReviews={2}
                                  />
                                </div>
                                {/* Menu Item Comments */}
                                <div className="mt-3 border-t border-white/5 pt-3">
                                  <MenuItemComments
                                    menuItemId={item.id!}
                                    menuItemName={item.name || ""}
                                    isDark={true}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddToCart(item.id!)}
                                className="mt-4 w-full bg-coffee-600 hover:bg-coffee-500 text-white py-2 rounded-lg transition-colors font-medium"
                              >
                                افزودن به سفارش
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">سفارش جدید</h2>
              <button
                onClick={() => setShowOrderForm(false)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-500"
              >
                ✕
              </button>
            </div>

            {!isCustomerAuthenticated ? (
              <div className="p-6 text-center space-y-4">
                <p className="text-white text-lg">برای ثبت سفارش باید وارد شوید</p>
                <button
                  onClick={() => {
                    setShowOrderForm(false);
                    router.push("/customer/login");
                  }}
                  className="px-6 py-2 rounded-lg bg-coffee-600 text-white hover:bg-coffee-500 transition font-medium"
                >
                  ورود / ثبت‌نام
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-white">اطلاعات شما</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">نام</label>
                      <input
                        type="text"
                        value={customer?.name || ""}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800/50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">شماره تماس</label>
                      <input
                        type="tel"
                        value={customer?.phoneNumber || ""}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800/50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">شماره میز *</label>
                      <input
                        type="number"
                        placeholder="شماره میز"
                        value={tableNumber}
                        onChange={e => setTableNumber(e.target.value)}
                        min="1"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-gray-500 focus:outline-none focus:border-coffee-600"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Items */}
                {cartItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-white">
                    محصولات انتخاب شده
                  </h3>
                  <div className="space-y-2">
                    {cartItems.map(cartItem => {
                      const item = items.find(i => i.id === cartItem.itemId);
                      return (
                        <div
                          key={cartItem.itemId}
                          className="flex items-center justify-between p-3 rounded-lg border border-neutral-700 bg-neutral-800"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              {item?.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatToman(item?.price || 0)} × {cartItem.quantity} = {formatToman((item?.price || 0) * cartItem.quantity)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={cartItem.quantity}
                              onChange={e =>
                                handleQuantityChange(
                                  cartItem.itemId,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 px-2 py-1 text-center rounded border border-neutral-600 bg-neutral-700 text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFromCart(cartItem.itemId)
                              }
                              className="p-1 hover:bg-red-500/20 rounded transition text-red-500"
                            >
                              ✕
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
                <label className="block font-semibold mb-2 text-white">
                  یادداشت (اختیاری)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="توضیحات اضافی..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-gray-500 focus:outline-none focus:border-coffee-600"
                />
              </div>

              {/* Total */}
              <div className="p-4 rounded-lg border-2 border-coffee-600 bg-coffee-600/10">
                <div className="text-sm text-gray-400 mb-1">مجموع:</div>
                <div className="text-3xl font-bold text-white">
                  {formatToman(calculateTotal())}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="px-6 py-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-900 transition"
                >
                  لغو
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-coffee-600 text-white hover:bg-coffee-500 transition font-medium"
                >
                  ثبت سفارش
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
