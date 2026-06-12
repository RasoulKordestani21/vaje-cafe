"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee, Star, MapPin, X } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/toast";
import HomepageReviews from "@/components/ratings/HomepageReviews";
import ExperienceCommentsDisplay from "@/components/experience/ExperienceCommentsDisplay";

interface SiteSettings {
  hero_title?: string;
  hero_subtitle?: string;
  feature_1_title?: string;
  feature_1_description?: string;
  feature_2_title?: string;
  feature_2_description?: string;
  feature_3_title?: string;
  feature_3_description?: string;
  site_name?: string;
  footer_address?: string;
}

interface Banner {
  id: string;
  title: string;
  image_url: string;
  type: string;
  priority: number;
}

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const { toasts, addToast, removeToast } = useToast();
  const hasCheckedStatus = React.useRef(false);

  useEffect(() => {
    if (hasCheckedStatus.current) return;

    const checkSiteStatus = async () => {
      try {
        const response = await fetch("/api/working-hours");
        if (response.ok) {
          const data = await response.json();
          if (data.siteStatus?.is_manually_closed === 1) {
            hasCheckedStatus.current = true;
            const closedUntil = data.siteStatus.closed_until;
            const reason = data.siteStatus.reason || "";

            if (closedUntil) {
              const closedUntilDate = new Date(closedUntil * 1000);
              const dateStr = closedUntilDate.toLocaleDateString("fa-IR");
              const timeStr = closedUntilDate.toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              addToast(
                `کافه تا ${dateStr} ساعت ${timeStr} ${reason ? `(${reason})` : ""} بسته است.`,
                "warning",
                10000
              );
            } else {
              addToast(
                `کافه به صورت موقت بسته است. ${reason ? `(${reason})` : ""}`,
                "warning",
                10000
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to check site status:", err);
      }
    };

    checkSiteStatus();
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/public").then((res) => res.json()),
      fetch("/api/banners?activeOnly=true").then((res) => res.json()),
    ])
      .then(([settingsData, bannersData]) => {
        if (settingsData.settings) {
          setSettings(settingsData.settings);
        }
        if (bannersData.banners) {
          const now = Math.floor(Date.now() / 1000);
          const activeBanners = bannersData.banners
            .filter(
              (b: Banner & { start_date?: number; end_date?: number; is_active: number }) => {
                if (b.is_active === 0) return false;
                if (b.start_date && b.start_date > now) return false;
                if (b.end_date && b.end_date < now) return false;
                return true;
              }
            )
            .sort((a: Banner, b: Banner) => b.priority - a.priority);
          setBanners(activeBanners);
        }
      })
      .catch((err) => console.error("Failed to fetch data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("vaje_visited");
    if (!hasVisited) {
      fetch("/api/stats", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "visit",
          data: { page: "home" },
        }),
      }).catch((err) => console.error("Failed to record visit:", err));
      sessionStorage.setItem("vaje_visited", "true");
    }
  }, []);

  const siteName = settings.site_name || "کافه واژه";
  const heroTitle = settings.hero_title || "حس‌های خود را بیدار کنید";
  const heroSubtitle =
    settings.hero_subtitle ||
    "دانه‌های مرغوب، باریستای حرفه‌ای و فضایی آرام برای لحظه‌های خوب شما.";
  const address =
    settings.footer_address ||
    "اسدآباد - خیابان صاحب‌زمان شرقی - دور میدان نون و قلم";

  const features = [
    {
      icon: Coffee,
      title: settings.feature_1_title || "دانه‌های تخصصی",
      description:
        settings.feature_1_description ||
        "برشته‌کاری دقیق با بهترین دانه‌های قهوه.",
    },
    {
      icon: Star,
      title: settings.feature_2_title || "باریستاهای حرفه‌ای",
      description:
        settings.feature_2_description ||
        "تیمی متخصص که طعم را با دقت می‌سازد.",
    },
    {
      icon: MapPin,
      title: settings.feature_3_title || "فضای آرام",
      description:
        settings.feature_3_description ||
        "محیطی مناسب برای استراحت و گفتگو.",
    },
  ];

  const activeBanner = banners.find((b) => !dismissedBanners.has(b.id));

  return (
    <div className="flex flex-col bg-neutral-950 text-white" dir="rtl">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {activeBanner && (
        <div className="border-b border-white/10 bg-neutral-900/90">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <p className="flex-1 text-sm text-neutral-200 leading-relaxed">
              {activeBanner.title}
            </p>
            <button
              onClick={() =>
                setDismissedBanners((prev) => new Set([...prev, activeBanner.id]))
              }
              className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors"
              aria-label="بستن اطلاعیه"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <section className="relative px-4 pt-8 pb-20 md:pt-12 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,53,15,0.18),_transparent_55%)]" />

        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-coffee-400 text-sm mb-4">{siteName}</p>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-white/10 rounded-lg mx-auto w-3/4" />
              <div className="h-5 bg-white/5 rounded-lg mx-auto w-full max-w-md" />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-snug mb-5">
                {heroTitle}
              </h1>
              <p className="text-neutral-400 text-base md:text-lg leading-relaxed mb-10">
                {heroSubtitle}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/menu"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-coffee-600 hover:bg-coffee-500 text-white rounded-xl font-medium transition-colors"
            >
              مشاهده منو
              <ArrowLeft size={18} />
            </Link>
            <a
              href="#visit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-neutral-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
            >
              آدرس ما
              <MapPin size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-14 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <ul className="divide-y divide-white/5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <li key={index} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="mt-0.5 w-10 h-10 shrink-0 rounded-lg bg-coffee-900/40 flex items-center justify-center text-coffee-400">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <HomepageReviews />
      <ExperienceCommentsDisplay />

      <section id="visit" className="border-t border-white/5 py-14 md:py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-white mb-3">
            به ما سر بزنید
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed whitespace-pre-line mb-8">
            {address}
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-coffee-400 hover:text-coffee-300 text-sm font-medium transition-colors"
          >
            مشاهده منوی کامل
            <ArrowLeft size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
