"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Images } from "lucide-react";
import { toPersianDigits } from "@/utils/format";
import { ThemeContext } from "@/app/providers";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  gallery_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  display_order: number;
  photo_count?: number;
  photos?: Photo[];
}

// ─── Flattened photo for grid display ─────────────────────────────────────────
interface FlatPhoto extends Photo {
  galleryTitle: string;
  galleryId: string;
}

// ═════════════════════════════════════════════════════════════════════════════
export default function GalleryPage() {
  const { isDark } = useContext(ThemeContext);

  const [galleries, setGalleries]   = useState<Gallery[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<string>("all");

  // Lightbox state
  const [lbIndex, setLbIndex]       = useState(0);
  const [lbOpen, setLbOpen]         = useState(false);

  useEffect(() => {
    fetch("/api/gallery?include_photos=true")
      .then(r => r.json())
      .then(data => setGalleries((data.galleries || []).slice(0, 10)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Flatten all photos into one array ─────────────────────────────────────
  const allPhotos: FlatPhoto[] = galleries.flatMap(g =>
    (g.photos ?? []).map(p => ({
      ...p,
      galleryTitle: g.title,
      galleryId: g.id,
    }))
  );

  const displayPhotos: FlatPhoto[] =
    activeTab === "all"
      ? allPhotos
      : allPhotos.filter(p => p.galleryId === activeTab);

  // ── Lightbox helpers ────────────────────────────────────────────────────────
  const openLightbox = (index: number) => {
    setLbIndex(index);
    setLbOpen(true);
  };

  const closeLightbox = useCallback(() => setLbOpen(false), []);

  const go = useCallback((dir: "prev" | "next") => {
    setLbIndex(i =>
      dir === "next"
        ? (i + 1) % displayPhotos.length
        : (i - 1 + displayPhotos.length) % displayPhotos.length
    );
  }, [displayPhotos.length]);

  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      closeLightbox();
      if (e.key === "ArrowRight")  go("next");
      if (e.key === "ArrowLeft")   go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lbOpen, go, closeLightbox]);

  // ── Surfaces ────────────────────────────────────────────────────────────────
  const bg     = isDark ? "bg-[#0f120e]"   : "bg-[#faf8f4]";
  const border = isDark ? "border-[#2c3329]" : "border-[#e5e0d8]";
  const text   = isDark ? "text-[#edf2eb]"   : "text-[#111814]";
  const muted  = isDark ? "text-[#8fa688]"   : "text-[#4b5563]";
  const mutedbg= isDark ? "bg-[#1f2520]"     : "bg-[#f0ece4]";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn("min-h-screen", bg)} dir="rtl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={cn("border-b px-4 py-8", border, isDark ? "bg-[#141a12]" : "bg-white")}>
        <div className="max-w-6xl mx-auto">
          <p className="text-[#186244] text-xs font-semibold uppercase tracking-widest mb-1">
            گالری
          </p>
          <h1 className={cn("text-2xl sm:text-3xl font-black mb-1", text)}>
            لحظات کافه واژه
          </h1>
          <p className={cn("text-sm", muted)}>
            تصاویری از فضا، نوشیدنی‌ها و لحظات ماندگار
          </p>
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      {galleries.length > 0 && (
        <div className={cn(
          "sticky top-[4.5rem] sm:top-[5rem] z-30 border-b",
          border,
          isDark ? "bg-[#141a12]/95 backdrop-blur-xl" : "bg-white/95 backdrop-blur-xl"
        )}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-3">
              {/* All tab */}
              <GalleryTab
                label="همه"
                count={allPhotos.length}
                active={activeTab === "all"}
                isDark={isDark}
                onClick={() => setActiveTab("all")}
              />
              {galleries.map(g => (
                <GalleryTab
                  key={g.id}
                  label={g.title}
                  count={g.photos?.length ?? g.photo_count ?? 0}
                  active={activeTab === g.id}
                  isDark={isDark}
                  onClick={() => setActiveTab(g.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {loading ? (
          <SkeletonGrid mutedbg={mutedbg} />
        ) : displayPhotos.length === 0 ? (
          <EmptyState muted={muted} mutedbg={mutedbg} />
        ) : (
          <>
            {/* Photo count */}
            <p className={cn("text-xs mb-5", muted)}>
              {toPersianDigits(displayPhotos.length.toString())} تصویر
            </p>

            {/* ── Masonry-style grid (CSS columns) ────────────────────── */}
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {displayPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden"
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? photo.galleryTitle}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        `https://picsum.photos/400/300?random=${photo.id}`;
                    }}
                  />
                  {/* hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                    <div className="translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {photo.caption && (
                        <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                      <p className="text-white/60 text-[10px] mt-0.5">{photo.galleryTitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lbOpen && displayPhotos[lbIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/96 flex flex-col items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="بستن"
          >
            <X size={20} />
          </button>

          {/* counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {toPersianDigits((lbIndex + 1).toString())} / {toPersianDigits(displayPhotos.length.toString())}
          </div>

          {/* prev / next */}
          {displayPhotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); go("next"); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="بعدی"
              >
                <ChevronRight size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); go("prev"); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="قبلی"
              >
                <ChevronLeft size={24} />
              </button>
            </>
          )}

          {/* image */}
          <div
            className="max-w-5xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={displayPhotos[lbIndex].image_url}
              alt={displayPhotos[lbIndex].caption ?? ""}
              className="max-h-[80vh] max-w-full w-auto rounded-xl object-contain shadow-2xl"
            />
            {/* caption */}
            {(displayPhotos[lbIndex].caption || displayPhotos[lbIndex].galleryTitle) && (
              <div className="mt-4 text-center">
                {displayPhotos[lbIndex].caption && (
                  <p className="text-white text-sm font-medium">
                    {displayPhotos[lbIndex].caption}
                  </p>
                )}
                <p className="text-white/40 text-xs mt-1">
                  {displayPhotos[lbIndex].galleryTitle}
                </p>
              </div>
            )}
          </div>

          {/* thumbnail strip */}
          {displayPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-xs overflow-hidden">
              {displayPhotos.slice(
                Math.max(0, lbIndex - 3),
                Math.min(displayPhotos.length, lbIndex + 4)
              ).map((p, i) => {
                const realIdx = Math.max(0, lbIndex - 3) + i;
                return (
                  <button
                    key={p.id}
                    onClick={e => { e.stopPropagation(); setLbIndex(realIdx); }}
                    className={cn(
                      "w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                      realIdx === lbIndex ? "border-white scale-110" : "border-white/20 opacity-50"
                    )}
                  >
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function GalleryTab({
  label, count, active, isDark, onClick,
}: {
  label: string; count: number; active: boolean;
  isDark: boolean; onClick: () => void;
}) {
  const mutedbg = isDark ? "bg-[#1f2520]" : "bg-[#f0ece4]";
  const muted   = isDark ? "text-[#8fa688]" : "text-[#4b5563]";
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
        active
          ? "bg-[#186244] text-white shadow-sm"
          : cn(mutedbg, muted)
      )}
    >
      {label}
      {count > 0 && (
        <span className={cn(
          "text-[10px] font-bold rounded-full px-1.5 py-0.5",
          active ? "bg-white/20 text-white" : isDark ? "bg-[#252b23] text-[#8fa688]" : "bg-[#e5e0d8] text-[#4b5563]"
        )}>
          {toPersianDigits(count.toString())}
        </span>
      )}
    </button>
  );
}

function SkeletonGrid({ mutedbg }: { mutedbg: string }) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
      {[260, 180, 220, 300, 160, 240, 200, 280].map((h, i) => (
        <div
          key={i}
          className={cn("break-inside-avoid rounded-xl animate-pulse", mutedbg)}
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function EmptyState({ muted, mutedbg }: { muted: string; mutedbg: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-24 rounded-2xl", mutedbg)}>
      <Images size={44} className={cn("mb-4", muted)} strokeWidth={1.5} />
      <p className={cn("text-base font-medium", muted)}>هنوز تصویری اضافه نشده</p>
      <p className={cn("text-sm mt-1", muted)}>به زودی تصاویر کافه را اینجا خواهید دید</p>
    </div>
  );
}
