"use client";

import React, { useState } from "react";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomer } from "@/context/CustomerContext";
import { useToast } from "@/components/ui/toast";

interface ExperienceCommentsProps {
  isDark?: boolean;
  onCommentSubmitted?: () => void;
}

const ExperienceComments: React.FC<ExperienceCommentsProps> = ({
  isDark = true,
  onCommentSubmitted,
}) => {
  const { customer, isAuthenticated } = useCustomer();
  const { warning, error: showError } = useToast();
  const [rating, setRating]           = useState(0);
  const [hovered, setHovered]         = useState(0);
  const [commentText, setCommentText] = useState("");
  const [customerName, setCustomerName]   = useState(customer?.name || "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phoneNumber || "");
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);

  const inputCls = cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all",
    "focus:ring-2 focus:ring-[#186244]/30 focus:border-[#186244]",
    isDark
      ? "bg-[#1f2520] border-[#2c3329] text-[#edf2eb] placeholder:text-[#556b52]"
      : "bg-[#f9f7f3] border-[#e5e0d8] text-[#111814] placeholder:text-[#9ca3af]"
  );

  const labelCls = cn(
    "block text-xs font-semibold mb-1.5",
    isDark ? "text-[#8fa688]" : "text-[#4b5563]"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { warning("لطفاً امتیاز خود را انتخاب کنید"); return; }
    if (!commentText.trim()) { warning("لطفاً نظر خود را بنویسید"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/experience-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          comment_text: commentText,
          rating,
          customer_name:  customerName  || null,
          customer_phone: customerPhone || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در ثبت نظر");
      }
      setSuccess(true);
      setCommentText("");
      setRating(0);
      setTimeout(() => setSuccess(false), 4000);
      onCommentSubmitted?.();
    } catch (err: any) {
      showError(err.message || "خطا در ثبت نظر");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 size={40} className="text-[#186244]" strokeWidth={1.5} />
        <p className={cn("text-base font-bold", isDark ? "text-[#edf2eb]" : "text-[#111814]")}>
          نظر شما ثبت شد
        </p>
        <p className={cn("text-sm", isDark ? "text-[#8fa688]" : "text-[#6b7280]")}>
          پس از بررسی و تایید مدیر نمایش داده خواهد شد
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

      {/* ── Rating ──────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls}>
          امتیاز شما <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              onMouseEnter={() => setHovered(v)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none"
            >
              <Star
                size={30}
                className={cn(
                  "transition-all hover:scale-110",
                  v <= (hovered || rating)
                    ? "text-amber-400 fill-amber-400"
                    : isDark ? "text-[#2c3329] fill-[#2c3329]" : "text-[#e5e0d8] fill-[#e5e0d8]"
                )}
              />
            </button>
          ))}
          {(hovered || rating) > 0 && (
            <span className={cn("text-xs mr-2", isDark ? "text-[#8fa688]" : "text-[#6b7280]")}>
              {["", "خیلی بد", "بد", "معمولی", "خوب", "عالی"][hovered || rating]}
            </span>
          )}
        </div>
      </div>

      {/* ── Comment text ────────────────────────────────────────────── */}
      <div>
        <label className={labelCls}>
          نظر شما <span className="text-red-500">*</span>
        </label>
        <textarea
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          rows={4}
          placeholder="تجربه خود از کافه واژه را با ما به اشتراک بگذارید..."
          className={cn(inputCls, "resize-none")}
          required
        />
      </div>

      {/* ── Optional identity fields ─────────────────────────────────── */}
      {!isAuthenticated && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>نام (اختیاری)</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className={inputCls}
              placeholder="نام شما"
            />
          </div>
          <div>
            <label className={labelCls}>شماره تماس (اختیاری)</label>
            <input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              type="tel"
              className={inputCls}
              placeholder="۰۹۱۲…"
            />
          </div>
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={submitting || !rating || !commentText.trim()}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all",
          "bg-[#186244] hover:bg-[#1f7a56] active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {submitting
          ? <><Loader2 size={16} className="animate-spin" /> در حال ارسال...</>
          : <><Send size={15} /> ارسال نظر</>}
      </button>
    </form>
  );
};

export default ExperienceComments;
