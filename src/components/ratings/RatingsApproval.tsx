"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Star, Loader2, MessageSquare, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPersianNumber } from "@/utils/dateFormatter";
import { timestampToJalaliString } from "@/utils/dateFormatter";
import { getAuthHeaders } from "@/services/dbService";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import CustomerAvatar from "@/components/customers/CustomerAvatar";
import {
  adminCard,
  adminInput,
  adminMutedSurface,
  adminTextMuted,
  adminTextPrimary,
  adminTextSecondary
} from "@/lib/adminTheme";

interface Rating {
  id: string;
  menu_item_id: string;
  menu_item_name?: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_profile_picture?: string | null;
  rating: number;
  review_text?: string;
  admin_approved: boolean;
  createdAt: number;
}

interface RatingsApprovalProps {
  isDark: boolean;
}

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < value
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300 dark:text-gray-600"
          }
        />
      ))}
    </div>
  );
}

function ReviewCard({
  rating,
  isDark,
  approving,
  variant,
  onApprove,
  onDelete,
  onUnapprove
}: {
  rating: Rating;
  isDark: boolean;
  approving: string | null;
  variant: "pending" | "approved";
  onApprove?: () => void;
  onDelete?: () => void;
  onUnapprove?: () => void;
}) {
  const busy = approving === rating.id;
  const customerLabel = rating.customer_name || rating.customer_phone || "مشتری";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border transition-colors",
        adminMutedSurface(isDark),
        isDark ? "border-white/10 hover:border-white/15" : "border-admin-border hover:border-admin-border-strong"
      )}
    >
      <CustomerAvatar
        profilePicture={rating.customer_profile_picture}
        name={rating.customer_name}
        phone={rating.customer_phone}
        size="md"
        isDark={isDark}
      />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("font-semibold text-sm", adminTextPrimary(isDark))}>
            {customerLabel}
          </span>
          <StarRating value={rating.rating} />
          {rating.menu_item_name && (
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full border",
                isDark
                  ? "border-coffee-500/30 text-coffee-400 bg-coffee-500/10"
                  : "border-coffee-200 text-coffee-700 bg-coffee-50"
              )}
            >
              {rating.menu_item_name}
            </span>
          )}
        </div>

        <p className={cn("text-xs", adminTextMuted(isDark))}>
          {timestampToJalaliString(rating.createdAt)}
        </p>

        {rating.review_text ? (
          <p className={cn("text-sm leading-relaxed pt-0.5", adminTextSecondary(isDark))}>
            {rating.review_text}
          </p>
        ) : (
          <p className={cn("text-xs italic", adminTextMuted(isDark))}>بدون متن نظر</p>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        {variant === "pending" ? (
          <>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={busy}
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs min-w-[88px]"
            >
              {busy ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Check size={14} />}
              تایید
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={busy}
              className={cn(
                "h-8 gap-1.5 text-xs min-w-[88px]",
                isDark
                  ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                  : "border-red-200 text-red-600 hover:bg-red-50"
              )}
            >
              <X size={14} />
              رد
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onUnapprove}
            disabled={busy}
            className={cn(
              "h-8 gap-1.5 text-xs min-w-[88px]",
              isDark
                ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                : "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            )}
          >
            {busy ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : null}
            لغو تایید
          </Button>
        )}
      </div>
    </div>
  );
}

const RatingsApproval: React.FC<RatingsApprovalProps> = ({ isDark }) => {
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ratings?approved_only=false", {
        credentials: "include",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
      } else {
        showError("خطا در بارگذاری نظرات");
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
      showError("خطا در بارگذاری نظرات");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ratingId: string, approved: boolean) => {
    try {
      setApproving(ratingId);
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ admin_approved: approved })
      });
      if (response.ok) {
        await fetchRatings();
        success(approved ? "نظر با موفقیت تایید شد" : "تایید نظر لغو شد");
      } else {
        showError("خطا در بروزرسانی نظر");
      }
    } catch (error) {
      console.error("Failed to update rating:", error);
      showError("خطا در بروزرسانی نظر");
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (ratingId: string) => {
    const ok = await confirm({
      title: "حذف نظر",
      message: "آیا از حذف این نظر اطمینان دارید؟",
      confirmLabel: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setApproving(ratingId);
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (response.ok) {
        await fetchRatings();
        success("نظر با موفقیت حذف شد");
      } else {
        showError("خطا در حذف نظر");
      }
    } catch (error) {
      console.error("Failed to delete rating:", error);
      showError("خطا در حذف نظر");
    } finally {
      setApproving(null);
    }
  };

  const filterRating = (r: Rating) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (r.customer_name?.toLowerCase().includes(q) ?? false) ||
      (r.customer_phone?.includes(q) ?? false) ||
      (r.menu_item_name?.toLowerCase().includes(q) ?? false) ||
      (r.review_text?.toLowerCase().includes(q) ?? false)
    );
  };

  const pendingRatings = useMemo(
    () => ratings.filter(r => !r.admin_approved).filter(filterRating),
    [ratings, search]
  );
  const approvedRatings = useMemo(
    () => ratings.filter(r => r.admin_approved).filter(filterRating),
    [ratings, search]
  );

  const inputClass = cn("w-full max-w-sm", adminInput(isDark));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Summary + search */}
      <div className={cn("p-4 rounded-2xl border", adminCard(isDark))}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className={cn("text-base font-bold flex items-center gap-2", adminTextPrimary(isDark))}>
              <MessageSquare size={18} className="text-coffee-500" />
              نظرات و امتیازها
            </h2>
            <p className={cn("text-sm mt-1", adminTextMuted(isDark))}>
              بررسی و تایید نظرات مشتریان
            </p>
          </div>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو نام، محصول، متن..."
            className={inputClass}
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={cn("p-3 rounded-xl border", adminMutedSurface(isDark), isDark ? "border-white/10" : "border-admin-border")}>
            <div className={cn("text-xs mb-1 flex items-center gap-1", adminTextMuted(isDark))}>
              <Clock size={13} />
              در انتظار
            </div>
            <div className={cn("text-xl font-bold", isDark ? "text-yellow-400" : "text-yellow-600")}>
              {formatPersianNumber(pendingRatings.length)}
            </div>
          </div>
          <div className={cn("p-3 rounded-xl border", adminMutedSurface(isDark), isDark ? "border-white/10" : "border-admin-border")}>
            <div className={cn("text-xs mb-1 flex items-center gap-1", adminTextMuted(isDark))}>
              <ShieldCheck size={13} />
              تایید شده
            </div>
            <div className={cn("text-xl font-bold", isDark ? "text-emerald-400" : "text-emerald-600")}>
              {formatPersianNumber(approvedRatings.length)}
            </div>
          </div>
          <div className={cn("p-3 rounded-xl border col-span-2 sm:col-span-1", adminMutedSurface(isDark), isDark ? "border-white/10" : "border-admin-border")}>
            <div className={cn("text-xs mb-1", adminTextMuted(isDark))}>کل نظرات</div>
            <div className={cn("text-xl font-bold", adminTextPrimary(isDark))}>
              {formatPersianNumber(ratings.length)}
            </div>
          </div>
        </div>
      </div>

      {/* Pending */}
      <section className={cn("p-4 rounded-2xl border", adminCard(isDark))}>
        <h3 className={cn("text-sm font-bold mb-4 flex items-center gap-2", adminTextPrimary(isDark))}>
          <Clock size={16} className="text-yellow-500" />
          در انتظار تایید
          <span className={cn("text-xs font-normal px-2 py-0.5 rounded-full", isDark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-50 text-yellow-700")}>
            {formatPersianNumber(pendingRatings.length)}
          </span>
        </h3>
        {pendingRatings.length === 0 ? (
          <p className={cn("text-center py-10 text-sm", adminTextMuted(isDark))}>
            {search ? "نظری یافت نشد" : "نظری در انتظار تایید نیست"}
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRatings.map(rating => (
              <ReviewCard
                key={rating.id}
                rating={rating}
                isDark={isDark}
                approving={approving}
                variant="pending"
                onApprove={() => handleApprove(rating.id, true)}
                onDelete={() => handleDelete(rating.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section className={cn("p-4 rounded-2xl border", adminCard(isDark))}>
        <h3 className={cn("text-sm font-bold mb-4 flex items-center gap-2", adminTextPrimary(isDark))}>
          <ShieldCheck size={16} className="text-emerald-500" />
          تایید شده
          <span className={cn("text-xs font-normal px-2 py-0.5 rounded-full", isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700")}>
            {formatPersianNumber(approvedRatings.length)}
          </span>
        </h3>
        {approvedRatings.length === 0 ? (
          <p className={cn("text-center py-10 text-sm", adminTextMuted(isDark))}>
            {search ? "نظری یافت نشد" : "هنوز نظری تایید نشده است"}
          </p>
        ) : (
          <div className="space-y-3">
            {approvedRatings.map(rating => (
              <ReviewCard
                key={rating.id}
                rating={rating}
                isDark={isDark}
                approving={approving}
                variant="approved"
                onUnapprove={() => handleApprove(rating.id, false)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RatingsApproval;
