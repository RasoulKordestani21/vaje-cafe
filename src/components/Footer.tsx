"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { Instagram, MapPin, Clock, Coffee } from "lucide-react";
import { LOGO_URL } from "@/constants";
import { ThemeContext } from "@/app/providers";
import { cn } from "@/lib/utils";

interface FooterSettings {
  footer_description?: string;
  footer_social_instagram?: string;
  footer_address?: string;
  logo_url?: string;
  site_name?: string;
}

interface WorkingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: number;
}

const NAV_LINKS = [
  { href: "/",          label: "خانه" },
  { href: "/menu",      label: "منو" },
  { href: "/gallery",   label: "گالری" },
  { href: "/experience",label: "نظرات" },
];

const Footer: React.FC = () => {
  const { isDark }  = useContext(ThemeContext);
  const [settings, setSettings]         = useState<FooterSettings>({});
  const [logoUrl, setLogoUrl]           = useState(LOGO_URL);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/public").then(r => r.json()),
      fetch("/api/working-hours").then(r => r.ok ? r.json() : { workingHours: [] }),
    ])
      .then(([sData, hData]) => {
        if (sData.settings) {
          setSettings(sData.settings);
          if (sData.settings.logo_url) setLogoUrl(sData.settings.logo_url);
        }
        if (Array.isArray(hData?.workingHours)) setWorkingHours(hData.workingHours);
      })
      .catch(() => {});
  }, []);

  const siteName    = settings.site_name              || "کافه واژه";
  const description = settings.footer_description     || "خلق لحظاتی از شفافیت و ارتباط با هنر قهوه تخصصی. تجربه‌ای متفاوت از عطر و طعم در فضایی آرام.";
  const instagram   = settings.footer_social_instagram || "@vaje.cafe";
  const address     = settings.footer_address          || "اسدآباد – خیابان صاحب‌زمان شرقی – دور میدان نون و قلم";

  const hoursText = (() => {
    const open = workingHours.filter(h => h.is_closed === 0);
    if (open.length === 0) return "همه روزه: ۷:۰۰ تا ۲۳:۰۰";
    const first = open[0];
    const same  = open.every(h => h.open_time === first.open_time && h.close_time === first.close_time);
    if (same) return `همه روزه: ${first.open_time} تا ${first.close_time}`;
    const opens  = open.map(h => h.open_time).sort();
    const closes = open.map(h => h.close_time).sort();
    return `${opens[0]} تا ${closes[closes.length - 1]}`;
  })();

  // ── Surfaces ───────────────────────────────────────────────────────────────
  const footerBg  = isDark ? "bg-[#0d1009]"      : "bg-[#f0ece4]";
  const borderCol = isDark ? "border-[#1f2520]"   : "border-[#ddd8cf]";
  const textMain  = isDark ? "text-[#edf2eb]"     : "text-[#111814]";
  const textMuted = isDark ? "text-[#6b7c67]"     : "text-[#6b7280]";
  const textLink  = isDark
    ? "text-[#8fa688] hover:text-[#4ade80] transition-colors"
    : "text-[#4b5563] hover:text-[#186244] transition-colors";

  return (
    <footer className="mt-8 px-3 pb-4 sm:px-5" dir="rtl">
      <div className={cn(
        "max-w-6xl mx-auto rounded-2xl overflow-hidden border",
        footerBg, borderCol
      )}>

        {/* ── Main content ────────────────────────────────────────────── */}
        <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
                style={{ background: "#186244" }}
              >
                V
              </div>
              <div className="leading-none">
                <p className="text-[10px] font-semibold text-[#186244] tracking-widest uppercase">CAFE</p>
                <p className={cn("text-sm font-black", textMain)}>VAJE</p>
              </div>
            </div>
            <p className={cn("text-xs leading-6 line-clamp-4", textMuted)}>
              {description}
            </p>
            {/* Instagram */}
            <a
              href={`https://www.instagram.com/${instagram.replace("@", "")}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("inline-flex items-center gap-2 text-xs font-medium", textLink)}
            >
              <Instagram size={14} className="shrink-0" />
              <span dir="ltr">{instagram}</span>
            </a>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className={cn("text-xs font-bold uppercase tracking-widest", textMuted)}>
              صفحات
            </h4>
            <ul className="space-y-2">
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className={cn("text-sm", textLink)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & hours */}
          <div className="space-y-3">
            <h4 className={cn("text-xs font-bold uppercase tracking-widest", textMuted)}>
              دسترسی
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={13} className="mt-0.5 text-[#186244] shrink-0" />
                <span className={cn("text-xs leading-5 whitespace-pre-line", textMuted)}>
                  {address}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock size={13} className="text-[#186244] shrink-0" />
                <span className={cn("text-xs", textMuted)}>{hoursText}</span>
              </li>
            </ul>
          </div>

          {/* Tagline / motto */}
          <div className="space-y-3">
            <h4 className={cn("text-xs font-bold uppercase tracking-widest", textMuted)}>
              درباره ما
            </h4>
            <div className="space-y-2">
              <p className={cn("text-xs leading-5", textMuted)}>
                جایی برای طعم خوب، فضای آرام و تجربه‌ای حرفه‌ای.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["کیفیت", "آرامش", "تجربه"].map(tag => (
                  <span
                    key={tag}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                      isDark
                        ? "bg-[#186244]/15 text-[#4ade80]"
                        : "bg-[#186244]/10 text-[#186244]"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────── */}
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-2",
          "px-6 py-4 border-t text-[11px]",
          borderCol, textMuted
        )}>
          <span>
            &copy; {new Date().getFullYear()} {siteName}. تمامی حقوق محفوظ است.
          </span>
          <span className="flex items-center gap-1">
            ساخته شده با <Coffee size={11} className={isDark ? "text-[#4ade80]" : "text-[#186244]"} /> در ایران
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
