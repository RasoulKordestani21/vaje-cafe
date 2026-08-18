"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  Star,
  MapPin,
  Clock,
  Shield,
  Headphones,
  Truck,
  ChevronLeft
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import HomepageReviews from "@/components/ratings/HomepageReviews";
import ExperienceCommentsDisplay from "@/components/experience/ExperienceCommentsDisplay";
import CustomerStories from "@/components/stories/CustomerStories";
import { ThemeContext } from "@/app/providers";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { CATEGORIES, MenuItem } from "@/types";
import { menuItemMatchesCategory } from "@/constants/menuCategories";
import { getMenuItemImageUrl, setMenuImageFallback } from "@/constants";
import { formatToman } from "@/utils/format";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Banner {
  id: string;
  title: string;
  image_url: string;
  type: string;
  priority: number;
  is_active: number;
  start_date?: number;
  end_date?: number;
}

// ─── Category meta ────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, string> = {
  همه: "☕",
  "نوشیدنی‌های گرم (Hot Beverages)": "☕",
  "نوشیدنی‌های سرد (Cold Beverages)": "🧊",
  "غذا و میان‌وعده (Food)": "🥪",
  "دسر و شیرینی (Desserts)": "🍰",
  "محصولات بسته‌بندی (Retail Products)": "📦",
};

// ─── Info blocks ──────────────────────────────────────────────────────────────
const INFO_BLOCKS = [
  { icon: Truck, title: "تحویل سریع", desc: "در کوتاه‌ترین زمان" },
  { icon: Headphones, title: "پشتیبانی ۲۴ ساعته", desc: "همیشه در دسترس" },
  { icon: Shield, title: "ضمانت کیفیت", desc: "بهترین دانه‌های قهوه" },
  { icon: Clock, title: "سرویس ۷ روزه", desc: "همه روزه باز هستیم" }
];

// ─── Hero image (fallback stock photo) ───────────────────────────────────────
const HERO_IMG =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&auto=format&fit=crop&q=80";

// ═════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const { isDark } = useContext(ThemeContext);
  const { getSetting } = useSiteSettings();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("همه");
  const [loading, setLoading] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(
    new Set()
  );
  const { warning } = useToast();
  const hasCheckedStatus = React.useRef(false);

  // ── Toast: manually-closed cafe ───────────────────────────────────────────
  useEffect(() => {
    if (hasCheckedStatus.current) return;
    fetch("/api/working-hours", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        if (data.isOpen === false && data.manualClosure) {
          hasCheckedStatus.current = true;
          const reason = data.reason || "";
          const from = data.manualClosure.from;
          const to = data.manualClosure.to;
          if (to) {
            warning(
              `کافه به‌صورت دستی از ${from} تا ${to} بسته است${reason ? ` (${reason})` : ""}.`
            );
          } else {
            warning(
              `کافه به‌صورت دستی از ${from} بسته است${reason ? ` (${reason})` : ""}.`
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch banners + menu (settings come from SiteSettingsContext) ──────────
  useEffect(() => {
    Promise.all([
      fetch("/api/banners?activeOnly=true").then(r => r.json()),
      fetch("/api/menu").then(r => r.json())
    ])
      .then(([bd, md]) => {
        if (bd.banners) {
          const now = Math.floor(Date.now() / 1000);
          setBanners(
            bd.banners
              .filter((b: Banner) => {
                if (b.is_active === 0) return false;
                if (b.start_date && b.start_date > now) return false;
                if (b.end_date && b.end_date < now) return false;
                return true;
              })
              .sort((a: Banner, b: Banner) => b.priority - a.priority)
          );
        }

        if (Array.isArray(md)) {
          const featured = md
            .filter(
              (i: MenuItem) => i.available && (i.is_pinned || i.is_suggested)
            )
            .slice(0, 8);
          setFeaturedItems(
            featured.length
              ? featured
              : md.filter((i: MenuItem) => i.available).slice(0, 6)
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Visit tracker ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStorage.getItem("vaje_visited")) {
      fetch("/api/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "visit", data: { page: "home" } })
      }).catch(() => {});
      sessionStorage.setItem("vaje_visited", "true");
    }
  }, []);

  // ── Derived values (from SiteSettingsContext) ─────────────────────────────
  const siteName  = getSetting("site_name", "کافه واژه");
  const heroTitle = getSetting("hero_title", "به کافه واژه خوش آمدید");
  const heroSub   = getSetting("hero_subtitle", "طعم واقعی قهوه و لحظات ناب را\nدر محیطی آرام تجربه کنید.");
  const address   = getSetting("footer_address", "اسدآباد - خیابان صاحب‌زمان شرقی - دور میدان نون و قلم");
  const activeBanner = banners.find(b => !dismissedBanners.has(b.id));

  // ── Category-filtered items ───────────────────────────────────────────────
  const categoryItems =
    activeCategory === "همه"
      ? featuredItems
      : featuredItems.filter(i =>
          menuItemMatchesCategory(i.category, activeCategory)
        );
  const displayItems = categoryItems.length ? categoryItems : featuredItems;

  // ── Surface ───────────────────────────────────────────────────────────────
  const bg = isDark ? "bg-[#0f120e]" : "bg-[#faf8f4]";
  const surface = isDark ? "bg-[#181c17]" : "bg-white";
  const border = isDark ? "border-[#2c3329]" : "border-[#e5e0d8]";
  const text = isDark ? "text-[#edf2eb]" : "text-[#111814]";
  const muted = isDark ? "text-[#8fa688]" : "text-[#4b5563]";
  const mutedbg = isDark ? "bg-[#1f2520]" : "bg-[#f0ece4]";

  return (
    <div className={cn("flex flex-col min-h-screen", bg, text)} dir="rtl">
      {/* ── Announcement banner ──────────────────────────────────────────── */}
      {activeBanner && (
        <div className={cn("border-b", border, surface)}>
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <span
              className={cn("w-1.5 h-1.5 rounded-full bg-[#186244] shrink-0")}
            />
            <p className={cn("flex-1 text-sm leading-relaxed", muted)}>
              {activeBanner.title}
            </p>
            <button
              onClick={() =>
                setDismissedBanners(p => new Set([...p, activeBanner.id]))
              }
              className={cn(
                "p-1 rounded-md transition-colors",
                muted,
                "hover:text-current"
              )}
              aria-label="بستن"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <CustomerStories isDark={isDark} />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — split layout
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col md:flex-row min-h-[82vh] md:min-h-[78vh]">
        {/* Text panel (right in RTL → renders second in DOM = LEFT visually)
            We put the image first in DOM so in RTL flex-row it ends up on the right */}

        {/* ── Coffee image (right side in RTL) ──────────────────────────── */}
        <div className="relative md:w-1/2 h-64 md:h-auto overflow-hidden order-first">
          <img
            src={HERO_IMG}
            alt="قهوه کافه واژه"
            className="w-full h-full object-cover"
          />
          {/* overlay */}
          <div
            className={cn(
              "absolute inset-0",
              isDark
                ? "bg-gradient-to-l from-[#0f120e] via-[#0f120e]/40 to-transparent"
                : "bg-gradient-to-l from-[#faf8f4] via-[#faf8f4]/30 to-transparent"
            )}
          />
        </div>

        {/* ── Text (left side in RTL) ───────────────────────────────────── */}
        <div
          className={cn(
            "relative md:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-16 py-16",
            isDark ? "bg-[#0f120e]" : "bg-[#faf8f4]"
          )}
        >
          {/* brand label */}
          <p className="text-[#186244] text-sm font-semibold mb-4 tracking-wide">
            ✦ {siteName}
          </p>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className={cn("h-12 rounded-xl w-4/5", mutedbg)} />
              <div className={cn("h-5 rounded-lg w-full max-w-sm", mutedbg)} />
              <div className={cn("h-5 rounded-lg w-3/4", mutedbg)} />
            </div>
          ) : (
            <>
              <h1
                className={cn(
                  "text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-5",
                  text
                )}
              >
                {heroTitle}
              </h1>
              <p
                className={cn(
                  "text-base md:text-lg leading-loose whitespace-pre-line mb-10",
                  muted
                )}
              >
                {heroSub}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white bg-[#186244] hover:bg-[#1f7a56] transition-all shadow-soft hover:shadow-lg"
            >
              مشاهده منو
              <ArrowLeft size={17} />
            </Link>
            <a
              href="#visit"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold border transition-all",
                isDark
                  ? "border-[#2c3329] text-[#8fa688] hover:bg-[#1f2520] hover:text-[#edf2eb]"
                  : "border-[#e5e0d8] text-[#4b5563] hover:bg-[#f0ece4] hover:text-[#111814]"
              )}
            >
              <MapPin size={16} />
              آدرس ما
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CATEGORY TABS
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className={cn(
          "sticky top-[4.5rem] sm:top-[5rem] z-30 border-b",
          border,
          isDark
            ? "bg-[#141a12]/95 backdrop-blur-xl"
            : "bg-white/95 backdrop-blur-xl"
        )}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {/* "همه" tab */}
            <CategoryTab
              label="همه"
              icon="☕"
              active={activeCategory === "همه"}
              isDark={isDark}
              onClick={() => setActiveCategory("همه")}
            />
            {CATEGORIES.map(cat => (
              <CategoryTab
                key={cat}
                label={cat}
                icon={CAT_ICONS[cat] || "☕"}
                active={activeCategory === cat}
                isDark={isDark}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4">
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-widest mb-1",
                  "text-[#186244]"
                )}
              >
                منتخب امروز
              </p>
              <h2 className={cn("text-xl sm:text-2xl font-bold", text)}>
                محصولات ویژه
              </h2>
            </div>
            <Link
              href="/menu"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                "text-[#186244] hover:text-[#1f7a56]"
              )}
            >
              مشاهده همه
              <ChevronLeft size={16} />
            </Link>
          </div>

          {/* Horizontal product scroll */}
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "shrink-0 w-48 sm:w-52 rounded-2xl animate-pulse",
                    mutedbg
                  )}
                  style={{ height: 260 }}
                />
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <p className={cn("py-10 text-center text-sm", muted)}>
              محصولی یافت نشد
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {displayItems.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  surface={surface}
                  border={border}
                  text={text}
                  muted={muted}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          INFO BLOCKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className={cn(
          "border-t border-b py-8 md:py-10",
          border,
          isDark ? "bg-[#141a12]" : "bg-white"
        )}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {INFO_BLOCKS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center",
                    isDark
                      ? "bg-[#1f2520] text-[#4ade80]"
                      : "bg-[#dcfce7] text-[#186244]"
                  )}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", text)}>{title}</p>
                  <p className={cn("text-xs mt-0.5", muted)}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      <HomepageReviews />

      {/* ── Experience Comments ───────────────────────────────────────────────── */}
      <ExperienceCommentsDisplay />

      {/* ══════════════════════════════════════════════════════════════════════
          VISIT / CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="visit" className={cn("border-t py-14 md:py-20", border)}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-4",
              isDark
                ? "bg-[#1f2520] text-[#4ade80]"
                : "bg-[#dcfce7] text-[#186244]"
            )}
          >
            بیایید و بچشید
          </span>
          <h2 className={cn("text-2xl sm:text-3xl font-black mb-3", text)}>
            به ما سر بزنید
          </h2>
          <p
            className={cn(
              "text-sm md:text-base leading-loose whitespace-pre-line mb-8",
              muted
            )}
          >
            {address}
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-white bg-[#186244] hover:bg-[#1f7a56] transition-all shadow-soft"
          >
            مشاهده منوی کامل
            <ArrowLeft size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryTab({
  label,
  icon,
  active,
  isDark,
  onClick
}: {
  label: string;
  icon: string;
  active: boolean;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap",
        active
          ? "bg-[#186244] text-white shadow-sm"
          : isDark
            ? "text-[#8fa688] hover:bg-[#1f2520] hover:text-[#edf2eb]"
            : "text-[#4b5563] hover:bg-[#f0ece4] hover:text-[#111814]"
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </button>
  );
}

function StarRow({ rating }: { rating?: number }) {
  const r = rating ?? 4;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(v => (
        <Star
          key={v}
          size={11}
          className={r >= v ? "text-[#eab308]" : "text-gray-400"}
          fill={r >= v ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function ProductCard({
  item,
  surface,
  border,
  text
}: {
  item: MenuItem;
  isDark: boolean;
  surface: string;
  border: string;
  text: string;
  muted: string;
}) {
  const imgSrc = getMenuItemImageUrl(item.imageUrl);

  return (
    <Link
      href="/menu"
      className={cn(
        "group shrink-0 w-44 sm:w-48 flex flex-col rounded-2xl border overflow-hidden transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg",
        surface,
        border
      )}
    >
      {/* image */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => setMenuImageFallback(e.target as HTMLImageElement)}
        />
        {item.is_pinned && (
          <span className="absolute top-2 right-2 bg-[#186244] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            ویژه
          </span>
        )}
        {item.is_suggested && !item.is_pinned && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            پیشنهاد
          </span>
        )}
      </div>

      {/* info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p
          className={cn(
            "text-sm font-semibold leading-snug line-clamp-1",
            text
          )}
        >
          {item.name}
        </p>
        <StarRow />
        <p className={cn("text-[11px] mt-auto font-bold", "text-[#186244]")}>
          {formatToman(item.price)}
        </p>
      </div>

      {/* add button */}
      <div className="px-3 pb-3">
        <div
          className={cn(
            "w-full flex items-center justify-center gap-1 rounded-full py-1.5 text-xs font-semibold text-white bg-[#186244] group-hover:bg-[#1f7a56] transition-colors"
          )}
        >
          افزودن به سفارش
        </div>
      </div>
    </Link>
  );
}
