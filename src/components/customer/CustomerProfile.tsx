"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2, Save, X, Package, ShoppingBag, Calendar,
  Loader2, Camera, Trash2, LogOut, User, Mail, Phone,
  Star, MessageSquare,
} from "lucide-react";
import { formatToman, toPersianDigits } from "@/utils/format";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { useCustomer } from "@/context/CustomerContext";
import { cn } from "@/lib/utils";
import CustomerMessagesHistory from "./CustomerMessagesHistory";
import CustomerLoyaltyView from "../loyalty/CustomerLoyaltyView";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CustomerProfileData {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
  profilePicture: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: number | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  tableNumber: string | null;
  customerNote: string | null;
  createdAt: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface CustomerProfileProps {
  isDark?: boolean;
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "در انتظار",         color: "bg-amber-500/15 text-amber-600" },
  preparing:  { label: "در حال آماده‌سازی", color: "bg-blue-500/15 text-blue-600" },
  ready:      { label: "آماده تحویل",       color: "bg-[#186244]/15 text-[#186244]" },
  completed:  { label: "تکمیل شده",         color: "bg-[#186244]/15 text-[#186244]" },
  cancelled:  { label: "لغو شده",           color: "bg-red-500/15 text-red-600" },
};

// ── Tab type ───────────────────────────────────────────────────────────────────
type Tab = "profile" | "orders" | "loyalty" | "messages";

// ═════════════════════════════════════════════════════════════════════════════
export default function CustomerProfile({ isDark = false }: CustomerProfileProps) {
  const router        = useRouter();
  const ctx           = useCustomer();
  const { isAuthenticated, authChecked, logout } = ctx;
  const updateCustomer = (ctx as any).updateCustomer as (c: {
    id: string; name: string | null; phoneNumber: string;
  }) => void;

  const [profile, setProfile]       = useState<CustomerProfileData | null>(null);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isEditing, setIsEditing]   = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [error, setError]           = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authChecked) return;
    if (!isAuthenticated) { router.push("/customer/login"); return; }
    fetchProfile();
    fetchOrders();
  }, [authChecked, isAuthenticated, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/customer/profile", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setProfile(d.customer);
        setEditedName(d.customer.name || "");
        setEditedEmail(d.customer.email || "");
        setPreviewImage(d.customer.profilePicture || null);
      } else if (res.status === 401) {
        logout(); router.push("/customer/login");
      } else {
        setError("خطا در دریافت اطلاعات پروفایل");
      }
    } catch { setError("خطا در ارتباط با سرور"); }
    finally  { setIsLoading(false); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/customer/orders", { credentials: "include" });
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
      else if (res.status === 401) { logout(); router.push("/customer/login"); }
    } catch {}
  };

  const handleSave = async () => {
    setIsSaving(true); setError("");
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editedName.trim() || null, email: editedEmail.trim() || null }),
      });
      if (res.ok) {
        const d = await res.json();
        setProfile(d.customer);
        setIsEditing(false);
        updateCustomer({ id: d.customer.id, name: d.customer.name, phoneNumber: d.customer.phoneNumber });
      } else if (res.status === 401) { logout(); router.push("/customer/login"); }
      else { const d = await res.json(); setError(d.error || "خطا"); }
    } catch { setError("خطا در ارتباط با سرور"); }
    finally  { setIsSaving(false); }
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("فایل تصویری انتخاب کنید"); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("حجم فایل نباید بیشتر از ۵ مگابایت باشد"); return; }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true); setError("");
    try {
      const fd = new FormData(); fd.append("image", file);
      const res = await fetch("/api/customer/profile/picture", {
        method: "POST", credentials: "include", body: fd,
      });
      if (res.ok) { await fetchProfile(); }
      else if (res.status === 401) { logout(); router.push("/customer/login"); }
      else { const d = await res.json(); setError(d.error || "خطا در آپلود"); setPreviewImage(profile?.profilePicture || null); }
    } catch { setError("خطا در ارتباط با سرور"); setPreviewImage(profile?.profilePicture || null); }
    finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePicture = async () => {
    setIsUploading(true); setError("");
    try {
      const res = await fetch("/api/customer/profile/picture", { method: "DELETE", credentials: "include" });
      if (res.ok) { setPreviewImage(null); await fetchProfile(); }
      else if (res.status === 401) { logout(); router.push("/customer/login"); }
      else { const d = await res.json(); setError(d.error || "خطا در حذف"); }
    } catch { setError("خطا در ارتباط با سرور"); }
    finally  { setIsUploading(false); }
  };

  // ── Surfaces ────────────────────────────────────────────────────────────────
  const bg      = isDark ? "bg-[#0f120e]"     : "bg-[#faf8f4]";
  const surface = isDark ? "bg-[#141a12]"     : "bg-white";
  const border  = isDark ? "border-[#2c3329]" : "border-[#e5e0d8]";
  const text    = isDark ? "text-[#edf2eb]"   : "text-[#111814]";
  const muted   = isDark ? "text-[#8fa688]"   : "text-[#6b7280]";
  const mutedbg = isDark ? "bg-[#1f2520]"     : "bg-[#f0ece4]";

  const inputCls = cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all",
    "focus:ring-2 focus:ring-[#186244]/30 focus:border-[#186244]",
    isDark
      ? "bg-[#1f2520] border-[#2c3329] text-[#edf2eb] placeholder:text-[#556b52]"
      : "bg-[#f9f7f3] border-[#e5e0d8] text-[#111814] placeholder:text-[#9ca3af]"
  );

  const readonlyCls = cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-sm",
    isDark ? "bg-[#181c17] border-[#2c3329] text-[#8fa688]"
           : "bg-[#f4f2ee] border-[#e5e0d8] text-[#6b7280]"
  );

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!authChecked || isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", bg)}>
        <Loader2 className="animate-spin text-[#186244] w-8 h-8" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", bg)}>
        <p className="text-red-500 text-sm">{error || "خطا در دریافت اطلاعات"}</p>
      </div>
    );
  }

  const avatarLetter = profile.name?.charAt(0) || profile.phoneNumber.slice(-1);
  const hasAvatar = !!(previewImage || profile.profilePicture);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile",  label: "پروفایل",   icon: <User size={15} /> },
    { id: "orders",   label: "سفارشات",   icon: <ShoppingBag size={15} /> },
    { id: "loyalty",  label: "امتیازها",  icon: <Star size={15} /> },
    { id: "messages", label: "پیام‌ها",   icon: <MessageSquare size={15} /> },
  ];

  return (
    <div className={cn("min-h-screen", bg)} dir="rtl">

      {/* ── Header banner ───────────────────────────────────────────────── */}
      <div className={cn("border-b", border, isDark ? "bg-[#141a12]" : "bg-white")}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {hasAvatar ? (
                <img
                  src={previewImage || profile.profilePicture || ""}
                  alt="پروفایل"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#186244]"
                />
              ) : (
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black",
                  "bg-[#186244] text-white"
                )}>
                  {avatarLetter}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Loader2 className="animate-spin text-white w-5 h-5" />
                </div>
              )}
            </div>

            {/* Name + phone */}
            <div className="flex-1 min-w-0">
              <p className={cn("text-lg font-black truncate", text)}>
                {profile.name || "بدون نام"}
              </p>
              <p className={cn("text-sm font-mono mt-0.5", muted)} dir="ltr">
                {profile.phoneNumber}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={() => { logout(); router.push("/"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                border, muted, "hover:text-red-500 hover:border-red-300"
              )}
            >
              <LogOut size={13} />
              خروج
            </button>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { icon: <Package size={14}/>,  label: "سفارش",   value: toPersianDigits(profile.totalOrders.toString()) },
              { icon: <ShoppingBag size={14}/>, label: "خرید", value: formatToman(profile.totalSpent) },
              { icon: <Calendar size={14}/>, label: "آخرین",   value: profile.lastOrderDate ? timestampToJalaliString(profile.lastOrderDate) : "—" },
            ].map((s, i) => (
              <div key={i} className={cn(
                "flex flex-col items-center gap-1 rounded-xl p-3 border text-center", mutedbg, border
              )}>
                <span className="text-[#186244]">{s.icon}</span>
                <span className={cn("text-base font-black leading-none", text)}>{s.value}</span>
                <span className={cn("text-[10px]", muted)}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all",
                  activeTab === t.id
                    ? "border-[#186244] text-[#186244]"
                    : cn("border-transparent", muted, "hover:text-[#186244]")
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {error && (
          <div className={cn(
            "text-xs px-4 py-3 rounded-xl border",
            isDark ? "bg-red-950/40 border-red-900/40 text-red-400" : "bg-red-50 border-red-200 text-red-600"
          )}>
            {error}
          </div>
        )}

        {/* ── PROFILE TAB ───────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className={cn("rounded-2xl border overflow-hidden", border, surface)}>
            {/* header row */}
            <div className={cn("flex items-center justify-between px-5 py-4 border-b", border)}>
              <p className={cn("text-sm font-bold", text)}>اطلاعات شخصی</p>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                    border, muted, "hover:text-[#186244] hover:border-[#186244]"
                  )}
                >
                  <Edit2 size={12} />
                  ویرایش
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setError(""); setEditedName(profile.name || ""); setEditedEmail(profile.email || ""); }}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all", border, muted)}
                    disabled={isSaving}
                  >
                    <X size={12} /> انصراف
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#186244] text-white disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    ذخیره
                  </button>
                </div>
              )}
            </div>

            {/* fields */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className={cn("flex items-center gap-1 text-xs font-semibold mb-1.5", muted)}>
                  <User size={12}/> نام
                </label>
                {isEditing ? (
                  <input
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    placeholder="نام خود را وارد کنید"
                    className={inputCls}
                  />
                ) : (
                  <div className={readonlyCls}>{profile.name || "—"}</div>
                )}
              </div>

              {/* Phone (readonly) */}
              <div>
                <label className={cn("flex items-center gap-1 text-xs font-semibold mb-1.5", muted)}>
                  <Phone size={12}/> شماره موبایل
                </label>
                <div className={cn(readonlyCls, "font-mono")} dir="ltr">{profile.phoneNumber}</div>
                <p className={cn("text-[10px] mt-1", muted)}>شماره موبایل قابل تغییر نیست</p>
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className={cn("flex items-center gap-1 text-xs font-semibold mb-1.5", muted)}>
                  <Mail size={12}/> ایمیل (اختیاری)
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={e => setEditedEmail(e.target.value)}
                    placeholder="email@example.com"
                    dir="ltr"
                    className={inputCls}
                  />
                ) : (
                  <div className={readonlyCls} dir="ltr">{profile.email || "—"}</div>
                )}
              </div>
            </div>

            {/* Profile picture section */}
            <div className={cn("px-5 pb-5 pt-3 border-t", border)}>
              <p className={cn("text-xs font-semibold mb-3", muted)}>تصویر پروفایل</p>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="hidden"
                  id="profile-picture-input"
                  disabled={isUploading}
                />
                <label
                  htmlFor="profile-picture-input"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                    "bg-[#186244] text-white hover:bg-[#1f7a56]",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Camera size={13} />
                  {isUploading ? "در حال آپلود..." : "تغییر تصویر"}
                </label>
                {hasAvatar && (
                  <button
                    onClick={handleDeletePicture}
                    disabled={isUploading}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all",
                      border, "text-red-500 hover:bg-red-500/10",
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Trash2 size={13} />
                    حذف تصویر
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          orders.length === 0 ? (
            <div className={cn("flex flex-col items-center justify-center py-20 rounded-2xl", mutedbg)}>
              <Package size={40} className={cn("mb-4", muted)} strokeWidth={1.5} />
              <p className={cn("text-sm font-medium", muted)}>هنوز سفارشی ثبت نکرده‌اید</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const st = STATUS_MAP[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <div key={order.id} className={cn("rounded-2xl border overflow-hidden", border, surface)}>
                    {/* order header */}
                    <div className={cn("flex items-center justify-between px-4 py-3 border-b", border)}>
                      <div>
                        <p className={cn("text-sm font-bold", text)}>
                          سفارش #{order.id.slice(0, 8)}
                        </p>
                        <p className={cn("text-xs mt-0.5", muted)}>
                          {timestampToJalaliString(order.createdAt)}
                          {order.tableNumber && ` · میز ${order.tableNumber}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-xs font-bold", text)}>{formatToman(order.total)}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", st.color)}>
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {/* items */}
                    <div className="px-4 py-3 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className={cn("flex justify-between text-xs", muted)}>
                          <span>{item.name} × {toPersianDigits(item.quantity.toString())}</span>
                          <span>{formatToman(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.customerNote && (
                        <p className={cn("text-xs italic mt-2 pt-2 border-t", border, muted)}>
                          یادداشت: {order.customerNote}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── LOYALTY TAB ───────────────────────────────────────────────── */}
        {activeTab === "loyalty" && (
          <CustomerLoyaltyView isDark={isDark} />
        )}

        {/* ── MESSAGES TAB ──────────────────────────────────────────────── */}
        {activeTab === "messages" && (
          <CustomerMessagesHistory isDark={isDark} />
        )}
      </div>
    </div>
  );
}
