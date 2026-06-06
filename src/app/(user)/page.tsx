"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee, Star, MapPin, X } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/toast";
import HomepageReviews from "@/components/ratings/HomepageReviews";
import StoryViewer from "@/components/stories/StoryViewer";
import StoryAvatar from "@/components/stories/StoryAvatar";
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
  footer_social_instagram?: string;
}

interface Banner {
  id: string;
  title: string;
  image_url: string;
  type: string;
  priority: number;
}

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
}

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState("/assets/logo.png");
  const [storyUsername, setStoryUsername] = useState("کافه واژه");
  const [loading, setLoading] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const { toasts, addToast, removeToast } = useToast();
  const hasCheckedStatus = React.useRef(false);

  // Check for manual close status and show toast (only once on mount)
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
              const timeStr = closedUntilDate.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
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

  // Fetch site settings, banners, and stories
  useEffect(() => {
    Promise.all([
      fetch("/api/settings/public").then(res => res.json()),
      fetch("/api/banners?activeOnly=true").then(res => res.json()),
      fetch("/api/stories").then(res => res.json())
    ])
      .then(([settingsData, bannersData, storiesData]) => {
        if (settingsData.settings) {
          setSettings(settingsData.settings);
          if (settingsData.settings.logo_url) {
            setLogoUrl(settingsData.settings.logo_url);
          }
          const instagram = settingsData.settings.footer_social_instagram?.replace(/^@/, "");
          setStoryUsername(
            instagram || settingsData.settings.site_name || "کافه واژه"
          );
        }
        if (bannersData.banners) {
          // Sort by priority and filter active banners
          const now = Math.floor(Date.now() / 1000);
          const activeBanners = bannersData.banners
            .filter((b: Banner & { start_date?: number; end_date?: number; is_active: number }) => {
              if (b.is_active === 0) return false;
              if (b.start_date && b.start_date > now) return false;
              if (b.end_date && b.end_date < now) return false;
              return true;
            })
            .sort((a: Banner, b: Banner) => b.priority - a.priority);
          setBanners(activeBanners);
        }
        if (storiesData.stories) {
          setStories(storiesData.stories);
        }
      })
      .catch(err => console.error("Failed to fetch data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Track visits (simple session based)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("vaje_visited");
    if (!hasVisited) {
      // Record visit directly via API with page tracking
      fetch("/api/stats", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "visit",
          data: { page: "home" }
        })
      }).catch(err => console.error("Failed to record visit:", err));
      sessionStorage.setItem("vaje_visited", "true");
    }
  }, []);

  // Default values
  const heroTitle = settings.hero_title || "حس‌های خود را بیدار کنید";
  const heroSubtitle = settings.hero_subtitle || "کافه واژه؛ جایی که دانه‌های مرغوب با هنر باریستا در می‌آمیزند. ترکیبی کامل از عطر، طعم و فضا.";
  
  // Split hero title for gradient effect
  const heroTitleParts = heroTitle.split(" ");
  const heroTitleFirst = heroTitleParts.slice(0, 3).join(" ");
  const heroTitleSecond = heroTitleParts.slice(3).join(" ") || heroTitleParts[heroTitleParts.length - 1];
  
  const features = [
    {
      icon: Coffee,
      title: settings.feature_1_title || "دانه‌های تخصصی",
      description: settings.feature_1_description || "ما با بهترین مزارع همکاری می‌کنیم تا باکیفیت‌ترین دانه‌های قهوه را با برشته‌کاری دقیق برای شما آماده کنیم."
    },
    {
      icon: Star,
      title: settings.feature_2_title || "باریستاهای حرفه‌ای",
      description: settings.feature_2_description || "تیم ما متشکل از باریستاهای عاشق و متخصصی است که علم و هنر قهوه را به خوبی می‌شناسند."
    },
    {
      icon: MapPin,
      title: settings.feature_3_title || "اتمسفر خاص",
      description: settings.feature_3_description || "پناهگاهی در دل شهر. طراحی شده برای آرامش، گفتگو و خلق لحظات به یاد ماندنی."
    }
  ];

  const handleDismissBanner = (bannerId: string) => {
    setDismissedBanners(prev => new Set([...prev, bannerId]));
  };

  return (
    <div className="flex flex-col" dir="rtl">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Story Viewer */}
      {selectedStoryIndex !== null && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
        />
      )}

      {/* Active Banners */}
      {banners.length > 0 && banners
        .filter(b => !dismissedBanners.has(b.id))
        .slice(0, 3) // Show max 3 banners
        .map((banner) => (
          <div
            key={banner.id}
            className="relative w-full overflow-hidden"
          >
            {/* Background with blur effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-coffee-900/80 via-coffee-800/70 to-coffee-900/80 backdrop-blur-md"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(120,53,15,0.3),_transparent_50%)]"></div>
            
            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {banner.image_url && (
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm"></div>
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="relative h-14 w-14 md:h-16 md:w-16 object-cover rounded-xl border-2 border-white/30 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-sm md:text-base text-white drop-shadow-lg">
                    {banner.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => handleDismissBanner(banner.id)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm border border-white/20 hover:border-white/40"
                aria-label="بستن"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            
            {/* Animated border */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-coffee-400/50 to-transparent animate-pulse"></div>
          </div>
        ))}

      {/* Stories Section — single ring per account (Instagram-style) */}
      {stories.length > 0 && (
        <section className="bg-gradient-to-b from-neutral-950 to-neutral-900 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <StoryAvatar
                src={logoUrl}
                alt={storyUsername}
                label={storyUsername}
                size="md"
                onClick={() => setSelectedStoryIndex(0)}
                onImageError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop className="w-full h-full object-cover">
            <source
              src="https://cdn.pixabay.com/video/2020/07/23/45358-443057031_large.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-900/40"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block border border-coffee-500/50 px-6 py-2 rounded-full bg-black/40 backdrop-blur-sm mb-4">
            <span className="text-coffee-400 uppercase tracking-widest text-sm font-bold">
              تاسیس ۱۴۰۴
            </span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-tight">
            {heroTitleFirst} <br />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-coffee-300 via-coffee-500 to-coffee-300">
              {heroTitleSecond}
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto leading-loose font-light">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/menu"
              className="px-10 py-4 bg-coffee-600 hover:bg-coffee-500 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-coffee-900/50 flex items-center justify-center gap-3"
            >
              مشاهده منو <ArrowLeft size={20} />
            </Link>
            <a
              href="#visit"
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full font-bold text-lg backdrop-blur-md transition-all flex items-center justify-center gap-3"
            >
              آدرس ما <MapPin size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 dark:bg-neutral-950 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center space-y-4 p-8 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-coffee-500/30 transition-colors group">
                  <div className="w-20 h-20 bg-coffee-900/30 rounded-full flex items-center justify-center mx-auto text-coffee-400 mb-6 group-hover:bg-coffee-900/50 transition-colors">
                    <Icon size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl text-white font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-8">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <HomepageReviews />

      {/* Experience Comments Section */}
      <ExperienceCommentsDisplay />

      {/* CTA Section */}
      <section id="visit" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Coffee beans"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 dark:bg-neutral-950/80 bg-primary-500/80"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-8 font-black">
            طعم تفاوت را احساس کنید
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-loose">
            به کافه واژه بپیوندید. چه برای شروع یک صبح پرانرژی و چه برای
            استراحتی کوتاه در عصر، ما منتظر شما هستیم.
          </p>
          <div className="inline-block p-1 rounded-full bg-gradient-to-l from-coffee-600 to-coffee-400">
            <Link
              href="/menu"
              className="block px-12 py-4 bg-black rounded-full text-white hover:bg-neutral-900 transition-colors font-bold text-lg"
            >
              مشاهده منوی کامل
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
