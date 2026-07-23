"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { useCustomer } from "@/context/CustomerContext";
import { useCart } from "@/context/CartContext";
import { ThemeContext } from "@/app/providers";
import { CATEGORIES, MenuItem } from "@/types";
import { menuItemMatchesCategory } from "@/constants/menuCategories";
import { formatToman } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  Search, X, ShoppingCart, Plus, Minus, Star,
  Loader2, Pin, ChevronDown, CheckCircle, AlertCircle,
} from "lucide-react";
import { recordMenuView } from "@/services/visitService";
import PreviousOrders from "@/components/menu/PreviousOrders";
import RatingSystem from "@/components/ratings/RatingSystem";

// ─── Category icons ────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, string> = {
  "همه": "☕",
  "نوشیدنی‌های گرم (Hot Beverages)": "☕",
  "نوشیدنی‌های سرد (Cold Beverages)": "🧊",
  "غذا و میان‌وعده (Food)": "🥪",
  "دسر و شیرینی (Desserts)": "🍰",
  "محصولات بسته‌بندی (Retail Products)": "📦",
};

// ═════════════════════════════════════════════════════════════════════════════
export default function MenuPage() {
  const router = useRouter();
  const { isDark } = useContext(ThemeContext);
  const { items, addOrder, isLoading } = useMenu();
  const { customer, isAuthenticated: isCustomerAuth, authChecked } = useCustomer();
  const {
    items: cartItems, addItem: addToCart,
    removeItem: removeFromCart, updateQuantity,
    clearCart, getTotalItems,
  } = useCart();

  const [activeCategory, setActiveCategory] = useState("همه");
  const [searchQuery, setSearchQuery]       = useState("");
  const [showCart, setShowCart]             = useState(false);
  const [tableNumber, setTableNumber]       = useState("");
  const [notes, setNotes]                   = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [orderSuccess, setOrderSuccess]     = useState(false);
  const [formError, setFormError]           = useState("");

  useEffect(() => { recordMenuView(); }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const byCategory = activeCategory === "همه"
    ? items
    : items.filter(i => menuItemMatchesCategory(i.category, activeCategory));

  const bySearch = searchQuery.trim()
    ? byCategory.filter(i => {
        const q = searchQuery.toLowerCase();
        return i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
      })
    : byCategory;

  const available     = bySearch.filter(i => i.available);
  const isFiltered    = searchQuery.trim() || activeCategory !== "همه";
  const pinned        = !isFiltered ? available.filter(i => i.is_pinned)  : [];
  const suggested     = !isFiltered ? available.filter(i => i.is_suggested && !i.is_pinned) : [];
  const regular       = !isFiltered ? available.filter(i => !i.is_pinned && !i.is_suggested) : available;

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const cartTotal = cartItems.reduce((sum, ci) => {
    const item = items.find(i => i.id === ci.itemId);
    return sum + (item?.price ?? 0) * ci.quantity;
  }, 0);

  const requireAuth = (cb: () => void) => {
    if (!authChecked) return;
    if (!isCustomerAuth) { router.push("/customer/login"); return; }
    cb();
  };

  const handleAdd = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && item.inStockFromInventory === false) return;
    requireAuth(() => addToCart(id, 1));
  };

  const getQty = (id: string) => cartItems.find(ci => ci.itemId === id)?.quantity ?? 0;

  // ── Order submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!tableNumber.trim()) { setFormError("شماره میز را وارد کنید"); return; }
    if (cartItems.length === 0) { setFormError("سبد خرید خالی است"); return; }

    setSubmitting(true);
    try {
      await addOrder(
        cartItems.map(ci => {
          const item = items.find(i => i.id === ci.itemId);
          return { menuItemId: ci.itemId, name: item?.name ?? "", quantity: ci.quantity, price: item?.price ?? 0 };
        }),
        notes,
        { customerName: customer?.name ?? "مشتری", customerPhone: customer?.phoneNumber ?? "", tableNumber }
      );
      setOrderSuccess(true);
      clearCart();
      setTableNumber("");
      setNotes("");
      setTimeout(() => { setShowCart(false); setOrderSuccess(false); }, 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "خطا در ثبت سفارش. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Highlight search terms ─────────────────────────────────────────────────
  const highlight = (str: string) => {
    if (!searchQuery.trim()) return str;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return str.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-[#186244]/30 text-[#4ade80] rounded px-0.5">{part}</mark>
        : part
    );
  };

  // ── Surface ────────────────────────────────────────────────────────────────
  const bg      = isDark ? "bg-[#0f120e]"  : "bg-[#faf8f4]";
  const surface = isDark ? "bg-[#181c17]"  : "bg-white";
  const border  = isDark ? "border-[#2c3329]" : "border-[#e5e0d8]";
  const text    = isDark ? "text-[#edf2eb]"   : "text-[#111814]";
  const muted   = isDark ? "text-[#8fa688]"   : "text-[#4b5563]";
  const mutedbg = isDark ? "bg-[#1f2520]"     : "bg-[#f0ece4]";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn("min-h-screen", bg, text)} dir="rtl">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cn("border-b py-8 px-4", border, isDark ? "bg-[#141a12]" : "bg-white")}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[#186244] text-xs font-semibold uppercase tracking-widest mb-1">منوی ما</p>
              <h1 className={cn("text-2xl sm:text-3xl font-black", text)}>منوی کافه واژه</h1>
            </div>

            {/* Cart button */}
            {isCustomerAuth && (
              <button
                onClick={() => setShowCart(true)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white",
                  "bg-[#186244] hover:bg-[#1f7a56] transition-all shadow-soft"
                )}
              >
                <ShoppingCart size={18} />
                <span className="hidden sm:inline">سبد خرید</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className={cn("relative mt-5 flex items-center rounded-xl border overflow-hidden", border, surface)}>
            <Search size={18} className={cn("absolute right-3.5", muted)} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجوی محصولات..."
              className={cn(
                "w-full pr-10 pl-10 py-3 text-sm bg-transparent outline-none",
                text, "placeholder:text-[#8fa688]"
              )}
              dir="rtl"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className={cn("absolute left-3.5", muted)}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category tabs (mobile horizontal, desktop sidebar) ──────────── */}
      <div className="max-w-6xl mx-auto px-4 mt-6 flex flex-col lg:flex-row gap-6">

        {/* DESKTOP sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className={cn("sticky top-28 rounded-2xl border p-4", surface, border)}>
            <p className={cn("text-xs font-semibold uppercase tracking-widest mb-3", muted)}>دسته‌بندی</p>
            <nav className="flex flex-col gap-0.5">
              {["همه", ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-right transition-all",
                    activeCategory === cat
                      ? "bg-[#186244] text-white"
                      : cn("hover:bg-opacity-60", mutedbg, muted, "hover:text-current")
                  )}
                >
                  <span className="text-base">{CAT_ICONS[cat] ?? "☕"}</span>
                  {cat === "همه" ? "همه محصولات" : cat}
                </button>
              ))}
            </nav>

            {/* Previous orders (if logged in) */}
            {isCustomerAuth && customer && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: isDark ? "#2c3329" : "#e5e0d8" }}>
                <PreviousOrders customerId={customer.id} isDark={isDark} />
              </div>
            )}
          </div>
        </aside>

        {/* MOBILE category chips */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {["همه", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-[#186244] text-white"
                  : cn(mutedbg, muted)
              )}
            >
              <span>{CAT_ICONS[cat] ?? "☕"}</span>
              {cat === "همه" ? "همه" : cat}
            </button>
          ))}
        </div>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        <main className="flex-1 pb-28 lg:pb-12">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-[#186244] w-9 h-9" />
            </div>
          ) : (
            <div className="space-y-10">

              {/* Pinned */}
              {pinned.length > 0 && (
                <ProductSection
                  title="محصولات ویژه"
                  badge="ویژه"
                  badgeColor="bg-[#186244]"
                  items={pinned}
                  isDark={isDark}
                  surface={surface}
                  border={border}
                  text={text}
                  muted={muted}
                  mutedbg={mutedbg}
                  searchQuery={searchQuery}
                  highlight={highlight}
                  getQty={getQty}
                  onAdd={handleAdd}
                />
              )}

              {/* Suggested */}
              {suggested.length > 0 && (
                <ProductSection
                  title="پیشنهاد امروز"
                  badge="پیشنهاد"
                  badgeColor="bg-amber-500"
                  items={suggested}
                  isDark={isDark}
                  surface={surface}
                  border={border}
                  text={text}
                  muted={muted}
                  mutedbg={mutedbg}
                  searchQuery={searchQuery}
                  highlight={highlight}
                  getQty={getQty}
                  onAdd={handleAdd}
                />
              )}

              {/* Regular / filtered */}
              {regular.length > 0 ? (
                <ProductSection
                  title={isFiltered
                    ? (searchQuery ? `نتایج "${searchQuery}"` : activeCategory)
                    : "همه محصولات"}
                  items={regular}
                  isDark={isDark}
                  surface={surface}
                  border={border}
                  text={text}
                  muted={muted}
                  mutedbg={mutedbg}
                  searchQuery={searchQuery}
                  highlight={highlight}
                  getQty={getQty}
                  onAdd={handleAdd}
                />
              ) : isFiltered ? (
                <div className={cn("flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed", border)}>
                  <p className={cn("text-base", muted)}>
                    {searchQuery ? `نتیجه‌ای برای «${searchQuery}» یافت نشد` : "در این دسته محصولی موجود نیست"}
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setActiveCategory("همه"); }}
                    className="mt-4 text-sm text-[#186244] hover:underline"
                  >
                    پاک کردن فیلتر
                  </button>
                </div>
              ) : null}

            </div>
          )}
        </main>
      </div>

      {/* ── Floating cart FAB (mobile) ───────────────────────────────────── */}
      {isCustomerAuth && getTotalItems() > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-40 lg:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between rounded-2xl px-5 py-4 text-white bg-[#186244] shadow-lg shadow-[#186244]/30"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <ShoppingCart size={18} />
              مشاهده سبد خرید
            </span>
            <span className="flex items-center gap-3 text-sm">
              <span className="bg-white/20 rounded-full px-2.5 py-0.5 font-bold text-xs">
                {getTotalItems()} آیتم
              </span>
              <span className="font-bold">{formatToman(cartTotal)}</span>
            </span>
          </button>
        </div>
      )}

      {/* ── Cart / Order modal ───────────────────────────────────────────── */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}
        >
          <div className={cn(
            "w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border shadow-xl overflow-hidden flex flex-col",
            "max-h-[92vh]",
            surface, border
          )}>
            {/* Modal header */}
            <div className={cn("flex items-center justify-between px-5 py-4 border-b shrink-0", border)}>
              <div>
                <h2 className={cn("font-bold text-lg", text)}>سبد خرید</h2>
                {getTotalItems() > 0 && (
                  <p className={cn("text-xs mt-0.5", muted)}>{getTotalItems()} آیتم</p>
                )}
              </div>
              <button onClick={() => setShowCart(false)} className={cn("p-1.5 rounded-lg", mutedbg, muted)}>
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Not authenticated */}
              {!isCustomerAuth ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", mutedbg)}>
                    <ShoppingCart size={28} className={muted} />
                  </div>
                  <p className={cn("text-base font-medium", text)}>برای ثبت سفارش وارد شوید</p>
                  <button
                    onClick={() => { setShowCart(false); router.push("/customer/login"); }}
                    className="rounded-full px-8 py-2.5 text-sm font-semibold text-white bg-[#186244] hover:bg-[#1f7a56]"
                  >
                    ورود / ثبت‌نام
                  </button>
                </div>
              ) : orderSuccess ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                  <CheckCircle size={52} className="text-[#186244]" />
                  <p className={cn("text-lg font-bold", text)}>سفارش شما ثبت شد!</p>
                  <p className={cn("text-sm", muted)}>سفارش شما به زودی آماده می‌شود</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-5">

                  {/* Error */}
                  {formError && (
                    <div className="flex items-center gap-2 rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {formError}
                    </div>
                  )}

                  {/* Customer info row */}
                  <div className={cn("rounded-xl p-4 space-y-3", mutedbg)}>
                    <p className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>اطلاعات شما</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className={cn("text-xs mb-1", muted)}>نام</p>
                        <p className={cn("text-sm font-medium", text)}>{customer?.name || "—"}</p>
                      </div>
                      <div>
                        <p className={cn("text-xs mb-1", muted)}>شماره تماس</p>
                        <p className={cn("text-sm font-medium", text)} dir="ltr">{customer?.phoneNumber || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Table number */}
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", text)}>
                      شماره میز <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="مثال: ۳"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-sm border outline-none",
                        "focus:ring-2 focus:ring-[#186244]/30 focus:border-[#186244]",
                        surface, border, text, "placeholder:text-[#8fa688]"
                      )}
                    />
                  </div>

                  {/* Cart items */}
                  {cartItems.length > 0 && (
                    <div>
                      <p className={cn("text-sm font-semibold mb-3", text)}>محصولات انتخابی</p>
                      <div className="space-y-2">
                        {cartItems.map(ci => {
                          const item = items.find(i => i.id === ci.itemId);
                          return (
                            <div key={ci.itemId} className={cn("flex items-center gap-3 p-3 rounded-xl border", border, mutedbg)}>
                              {/* thumbnail */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={item?.imageUrl || `https://picsum.photos/60/60?random=${ci.itemId}`}
                                  alt={item?.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium truncate", text)}>{item?.name}</p>
                                <p className="text-xs text-[#186244] font-semibold mt-0.5">{formatToman((item?.price ?? 0) * ci.quantity)}</p>
                              </div>
                              {/* qty controls */}
                              <div className={cn("flex items-center gap-2 rounded-full px-2 py-1", isDark ? "bg-[#252b23]" : "bg-[#e5e0d8]")}>
                                <button
                                  type="button"
                                  onClick={() => ci.quantity <= 1 ? removeFromCart(ci.itemId) : updateQuantity(ci.itemId, ci.quantity - 1)}
                                  className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm", surface, muted)}
                                >
                                  <Minus size={12} />
                                </button>
                                <span className={cn("text-sm font-bold w-4 text-center", text)}>{ci.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(ci.itemId, ci.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-[#186244] text-white flex items-center justify-center"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty cart */}
                  {cartItems.length === 0 && (
                    <div className={cn("text-center py-10 rounded-xl", mutedbg)}>
                      <p className={cn("text-sm", muted)}>سبد خرید خالی است</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", text)}>یادداشت (اختیاری)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="توضیحات سفارش..."
                      rows={2}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none",
                        "focus:ring-2 focus:ring-[#186244]/30 focus:border-[#186244]",
                        surface, border, text, "placeholder:text-[#8fa688]"
                      )}
                    />
                  </div>

                  {/* Total + submit */}
                  <div className={cn("rounded-xl p-4", isDark ? "bg-[#186244]/15 border border-[#186244]/30" : "bg-[#dcfce7] border border-[#186244]/20")}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={cn("text-sm", muted)}>مجموع سفارش</span>
                      <span className={cn("text-lg font-black text-[#186244]")}>{formatToman(cartTotal)}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || cartItems.length === 0}
                      className={cn(
                        "w-full rounded-full py-3 text-sm font-bold text-white transition-all",
                        "bg-[#186244] hover:bg-[#1f7a56] disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> در حال ثبت...
                        </span>
                      ) : "ثبت سفارش"}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProductSection ────────────────────────────────────────────────────────────
function ProductSection({
  title, badge, badgeColor, items,
  isDark, surface, border, text, muted, mutedbg,
  searchQuery, highlight, getQty, onAdd,
}: {
  title: string; badge?: string; badgeColor?: string; items: MenuItem[];
  isDark: boolean; surface: string; border: string;
  text: string; muted: string; mutedbg: string;
  searchQuery: string;
  highlight: (s: string) => React.ReactNode;
  getQty: (id: string) => number;
  onAdd: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        {badge && (
          <span className={cn("text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide", badgeColor)}>
            {badge}
          </span>
        )}
        <h2 className={cn("text-lg font-bold", text)}>{title}</h2>
        <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", mutedbg, muted)}>
          {items.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {items.map(item => (
          <MenuCard
            key={item.id}
            item={item}
            isDark={isDark}
            surface={surface}
            border={border}
            text={text}
            muted={muted}
            mutedbg={mutedbg}
            searchQuery={searchQuery}
            highlight={highlight}
            qty={getQty(item.id!)}
            onAdd={() => onAdd(item.id!)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── MenuCard ─────────────────────────────────────────────────────────────────
function MenuCard({
  item, isDark, surface, border, text, muted, mutedbg,
  highlight, qty, onAdd,
}: {
  item: MenuItem; isDark: boolean;
  surface: string; border: string;
  text: string; muted: string; mutedbg: string;
  searchQuery: string;
  highlight: (s: string) => React.ReactNode;
  qty: number; onAdd: () => void;
}) {
  const imgSrc = item.imageUrl || `https://picsum.photos/300/300?random=${item.id}`;
  const outOfInventory = item.inStockFromInventory === false;

  return (
    <div className={cn(
      "group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200",
      "hover:-translate-y-0.5 hover:shadow-lg",
      outOfInventory && "opacity-75",
      surface, border
    )}>
      {/* image */}
      <div className="relative h-36 sm:h-40 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.name}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            outOfInventory && "grayscale"
          )}
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/300/300?random=${item.id}`; }}
        />
        {outOfInventory && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            عدم موجودی
          </span>
        )}
        {/* badge */}
        {item.is_pinned ? (
          <span className="absolute top-2 right-2 bg-[#186244] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Pin size={9} fill="currentColor" /> ویژه
          </span>
        ) : item.is_suggested ? (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Star size={9} fill="currentColor" /> پیشنهاد
          </span>
        ) : null}
        {/* category chip */}
        <span className={cn(
          "absolute bottom-2 right-2 text-[9px] font-medium px-2 py-0.5 rounded-full",
          isDark ? "bg-black/60 text-white/80" : "bg-white/80 text-[#4b5563]"
        )}>
          {item.category}
        </span>
      </div>

      {/* body */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        <p className={cn("text-sm font-semibold leading-snug line-clamp-1", text)}>
          {highlight(item.name ?? "")}
        </p>
        {item.description && (
          <p className={cn("text-xs leading-relaxed line-clamp-2", muted)}>
            {highlight(item.description)}
          </p>
        )}

        {/* Rating */}
        <div className="mt-1">
          <RatingSystem menuItemId={item.id!} isDark={isDark} showAverage={true} size="sm" />
        </div>

        {/* Price + add */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs font-bold text-[#186244]">
            {formatToman(item.price)}
          </span>
          {outOfInventory ? (
            <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", mutedbg, muted)}>
              ناموجود
            </span>
          ) : (
            <button
              onClick={onAdd}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white transition-all",
                "bg-[#186244] hover:bg-[#1f7a56] active:scale-95",
                qty > 0 && "pr-2"
              )}
            >
              {qty > 0 && <span className="font-bold">{qty}×</span>}
              <Plus size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
