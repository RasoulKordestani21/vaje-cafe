"use client";

import React, { useState, useEffect, useContext } from "react";
import { Star, MessageSquare, Loader2, Quote, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJalaliDate, timestampToJalali } from "@/utils/jalaliDateUtils";
import { toPersianDigits } from "@/utils/format";
import { ThemeContext } from "@/app/providers";
import ExperienceComments from "@/components/experience/ExperienceComments";

interface ExperienceComment {
  id: string;
  comment_text: string;
  rating: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_profile_picture?: string | null;
  created_at: string;
  createdAt?: number;
}

function formatCommentDate(comment: ExperienceComment): string {
  const ts = comment.createdAt
    ?? (/^\d+$/.test(comment.created_at)
      ? parseInt(comment.created_at, 10)
      : Math.floor(new Date(comment.created_at).getTime() / 1000));
  return formatJalaliDate(timestampToJalali(ts));
}

// ─── Star row helper ───────────────────────────────────────────────────────────
function StarRow({ value, max = 5, size = 16 }: { value: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(value) ? "text-amber-400 fill-amber-400" : "text-[#ccc] fill-[#ccc]/20"}
        />
      ))}
    </div>
  );
}

// ─── Rating bar ───────────────────────────────────────────────────────────────
function RatingBar({ star, count, total, isDark }: { star: number; count: number; total: number; isDark: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("w-4 shrink-0 text-left", isDark ? "text-[#8fa688]" : "text-[#6b7280]")}>
        {star}
      </span>
      <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
      <div className={cn("flex-1 rounded-full h-1.5 overflow-hidden", isDark ? "bg-[#2c3329]" : "bg-[#e5e0d8]")}>
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("w-7 text-left shrink-0", isDark ? "text-[#8fa688]" : "text-[#6b7280]")}>
        {toPersianDigits(count.toString())}
      </span>
    </div>
  );
}

// ─── Comment card ─────────────────────────────────────────────────────────────
function CommentCard({ comment, isDark }: { comment: ExperienceComment; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = comment.comment_text.length > 200;
  const display = expanded ? comment.comment_text : comment.comment_text.slice(0, 200);

  const surface = isDark ? "bg-[#181c17] border-[#2c3329]" : "bg-white border-[#e5e0d8]";
  const text    = isDark ? "text-[#edf2eb]" : "text-[#111814]";
  const muted   = isDark ? "text-[#8fa688]" : "text-[#6b7280]";

  const authorLabel = comment.customer_name || (
    comment.customer_phone
      ? comment.customer_phone.slice(-4).padStart(comment.customer_phone.length, "•")
      : "مشتری ناشناس"
  );

  return (
    <div className={cn(
      "break-inside-avoid mb-3 rounded-2xl border p-5 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-md",
      surface
    )}>
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {comment.customer_profile_picture ? (
            <img
              src={comment.customer_profile_picture}
              alt={authorLabel}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#186244]/40 shrink-0"
            />
          ) : (
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              isDark ? "bg-[#1f2e25] text-[#4ade80]" : "bg-[#e6f4ec] text-[#186244]"
            )}>
              {authorLabel.slice(0, 1)}
            </div>
          )}
          <div>
            <p className={cn("text-sm font-semibold leading-none mb-1", text)}>{authorLabel}</p>
            <p className={cn("text-[10px]", muted)}>
              {formatCommentDate(comment)}
            </p>
          </div>
        </div>
        <StarRow value={comment.rating} size={13} />
      </div>

      {/* body */}
      <p className={cn("text-sm leading-7", muted)}>
        {display}{long && !expanded ? "…" : ""}
      </p>
      {long && (
        <button
          onClick={() => setExpanded(v => !v)}
          className={cn(
            "self-start flex items-center gap-1 text-xs font-medium text-[#186244]",
            "hover:underline transition-all"
          )}
        >
          {expanded ? "کمتر" : "بیشتر"}
          <ChevronDown size={13} className={cn("transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ExperiencePage() {
  const { isDark } = useContext(ThemeContext);

  const [comments, setComments]   = useState<ExperienceComment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const LIMIT = 15;

  const fetchComments = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await fetch(
        `/api/experience-comments?approved_only=true&limit=${LIMIT}&offset=${(currentPage - 1) * LIMIT}`
      );
      if (res.ok) {
        const data = await res.json();
        const fetched: ExperienceComment[] = data.comments || [];
        setComments(prev => (currentPage === 1 || reset) ? fetched : [...prev, ...fetched]);
        setHasMore(fetched.length === LIMIT);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [page]);

  const handleCommentSubmitted = () => {
    setPage(1);
    fetchComments(true);
    setShowForm(false);
  };

  // ── Rating stats ─────────────────────────────────────────────────────────
  const total       = comments.length;
  const avgRating   = total > 0
    ? comments.reduce((s, c) => s + c.rating, 0) / total
    : 0;
  const dist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: comments.filter(c => c.rating === s).length,
  }));

  // ── Surfaces ─────────────────────────────────────────────────────────────
  const bg      = isDark ? "bg-[#0f120e]"   : "bg-[#faf8f4]";
  const border  = isDark ? "border-[#2c3329]" : "border-[#e5e0d8]";
  const text    = isDark ? "text-[#edf2eb]"   : "text-[#111814]";
  const muted   = isDark ? "text-[#8fa688]"   : "text-[#6b7280]";
  const mutedbg = isDark ? "bg-[#1f2520]"     : "bg-[#f0ece4]";

  return (
    <div className={cn("min-h-screen", bg)} dir="rtl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={cn("border-b px-4 py-8", border, isDark ? "bg-[#141a12]" : "bg-white")}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[#186244] text-xs font-semibold uppercase tracking-widest mb-1">
              تجربیات
            </p>
            <h1 className={cn("text-2xl sm:text-3xl font-black mb-1", text)}>
              نظرات مشتریان
            </h1>
            <p className={cn("text-sm", muted)}>
              تجربه واقعی مشتریان کافه واژه
            </p>
          </div>

          {/* Write CTA */}
          <button
            onClick={() => setShowForm(v => !v)}
            className={cn(
              "shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
              showForm
                ? "bg-[#186244] text-white"
                : isDark ? "bg-[#1f2520] text-[#edf2eb] hover:bg-[#186244] hover:text-white"
                         : "bg-[#f0ece4] text-[#111814] hover:bg-[#186244] hover:text-white"
            )}
          >
            <MessageSquare size={15} />
            {showForm ? "بستن فرم" : "ثبت نظر"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Submit form (collapsible) ────────────────────────────────── */}
        {showForm && (
          <div className={cn(
            "rounded-2xl border overflow-hidden transition-all",
            border,
            isDark ? "bg-[#141a12]" : "bg-white"
          )}>
            <div className="px-6 pt-5 pb-1">
              <p className={cn("text-base font-bold", text)}>تجربه خود را بنویسید</p>
              <p className={cn("text-xs mt-0.5", muted)}>
                نظر شما پس از تایید مدیر نمایش داده خواهد شد
              </p>
            </div>
            <ExperienceComments isDark={isDark} onCommentSubmitted={handleCommentSubmitted} />
          </div>
        )}

        {/* ── Rating summary ───────────────────────────────────────────── */}
        {total > 0 && (
          <div className={cn(
            "flex flex-col sm:flex-row gap-6 rounded-2xl border p-5",
            border,
            isDark ? "bg-[#141a12]" : "bg-white"
          )}>
            {/* average */}
            <div className="flex flex-col items-center justify-center sm:w-40 shrink-0 gap-1">
              <span className={cn("text-5xl font-black", text)}>
                {toPersianDigits(avgRating.toFixed(1))}
              </span>
              <StarRow value={avgRating} size={16} />
              <p className={cn("text-xs mt-1", muted)}>
                از {toPersianDigits(total.toString())} نظر
              </p>
            </div>

            {/* distribution */}
            <div className="flex-1 flex flex-col justify-center gap-1.5">
              {dist.map(d => (
                <RatingBar key={d.star} star={d.star} count={d.count} total={total} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* ── Comments ────────────────────────────────────────────────── */}
        {loading && comments.length === 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn("break-inside-avoid mb-3 rounded-2xl animate-pulse", mutedbg)}
                style={{ height: [130, 100, 160, 120, 90, 140][i] }}
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className={cn("flex flex-col items-center justify-center py-24 rounded-2xl", mutedbg)}>
            <Quote size={44} className={cn("mb-4", muted)} strokeWidth={1.5} />
            <p className={cn("text-base font-medium", muted)}>هنوز نظری ثبت نشده</p>
            <p className={cn("text-sm mt-1", muted)}>اولین نفری باشید که تجربه خود را ثبت می‌کنید</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#186244] text-white text-sm font-semibold"
            >
              <MessageSquare size={15} /> ثبت نظر
            </button>
          </div>
        ) : (
          <>
            <p className={cn("text-xs", muted)}>
              {toPersianDigits(total.toString())} نظر تایید شده
            </p>

            {/* masonry grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
              {comments.map(c => (
                <CommentCard key={c.id} comment={c} isDark={isDark} />
              ))}
            </div>

            {/* load more */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border transition-all",
                    border,
                    isDark
                      ? "text-[#edf2eb] hover:bg-[#186244] hover:border-[#186244] hover:text-white"
                      : "text-[#111814] hover:bg-[#186244] hover:border-[#186244] hover:text-white",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                  {loading ? "در حال بارگذاری..." : "نظرات بیشتر"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
